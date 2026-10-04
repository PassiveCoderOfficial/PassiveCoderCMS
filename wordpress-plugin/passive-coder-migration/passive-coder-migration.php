<?php
/**
 * Plugin Name:       Passive Coder Migration
 * Plugin URI:        https://www.passivecoder.com
 * Description:       Moves your pages, blog posts, WooCommerce products and customers to your Passive Coder site, with images, SEO titles and old-link redirects.
 * Version:           1.1.0
 * Requires at least: 5.6
 * Requires PHP:      7.4
 * Author:            Passive Coder
 * License:           GPL-2.0-or-later
 * Text Domain:       passive-coder-migration
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class PCMig {
	const OPT_KEY      = 'pcmig_key';
	const OPT_ENDPOINT = 'pcmig_endpoint';
	const OPT_JOB      = 'pcmig_job';
	const DEFAULT_ENDPOINT = 'https://www.passivecoder.com/api/import/plugin';
	const BATCH        = 10;

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_post_pcmig_save', array( __CLASS__, 'save' ) );
		foreach ( array( 'hello', 'start', 'push', 'step' ) as $a ) {
			add_action( 'wp_ajax_pcmig_' . $a, array( __CLASS__, 'ajax_' . $a ) );
		}
	}

	public static function menu() {
		add_management_page( 'Passive Coder Migration', 'Passive Coder Migration', 'manage_options', 'passive-coder-migration', array( __CLASS__, 'page' ) );
	}

	/* ── Remote API ───────────────────────────────────────────────────── */

	private static function remote( $payload ) {
		$key = get_option( self::OPT_KEY );
		if ( ! $key ) {
			return new WP_Error( 'pcmig', 'Add your migration key first.' );
		}
		$res = wp_remote_post( get_option( self::OPT_ENDPOINT, self::DEFAULT_ENDPOINT ), array(
			'timeout' => 60,
			'headers' => array( 'Authorization' => 'Bearer ' . $key, 'Content-Type' => 'application/json' ),
			'body'    => wp_json_encode( $payload ),
		) );
		if ( is_wp_error( $res ) ) {
			return $res;
		}
		$code = wp_remote_retrieve_response_code( $res );
		$body = json_decode( wp_remote_retrieve_body( $res ), true );
		if ( $code >= 400 ) {
			return new WP_Error( 'pcmig', isset( $body['error'] ) ? $body['error'] : 'Request failed (' . $code . ')' );
		}
		return is_array( $body ) ? $body : array();
	}

	private static function guard() {
		if ( ! current_user_can( 'manage_options' ) || ! check_ajax_referer( 'pcmig', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => 'Not allowed' ), 403 );
		}
		if ( function_exists( 'set_time_limit' ) ) {
			@set_time_limit( 120 ); // phpcs:ignore
		}
	}

	private static function reply( $r ) {
		if ( is_wp_error( $r ) ) {
			wp_send_json_error( array( 'message' => $r->get_error_message() ) );
		}
		wp_send_json_success( $r );
	}

	/* ── What gets migrated ───────────────────────────────────────────── */

	private static function types() {
		$t = array( 'page' => 'Pages', 'post' => 'Blog posts', 'menu' => 'Menus' );
		if ( class_exists( 'WooCommerce' ) ) {
			$t['product']  = 'Products';
			$t['customer'] = 'Customers';
			$t['order']    = 'Orders';
		}
		return $t;
	}

	private static function count_type( $type ) {
		if ( 'menu' === $type ) {
			return count( wp_get_nav_menus() );
		}
		if ( 'order' === $type ) {
			return function_exists( 'wc_get_orders' ) ? count( wc_get_orders( array( 'limit' => -1, 'return' => 'ids', 'type' => 'shop_order' ) ) ) : 0;
		}
		if ( 'customer' === $type ) {
			$q = new WP_User_Query( array( 'role' => 'customer', 'number' => 1, 'count_total' => true, 'fields' => 'ID' ) );
			return (int) $q->get_total();
		}
		$c = wp_count_posts( $type );
		$n = 0;
		foreach ( array( 'publish', 'draft', 'pending', 'private', 'future' ) as $s ) {
			$n += isset( $c->$s ) ? (int) $c->$s : 0;
		}
		return $n;
	}

	private static function path( $url ) {
		$p = wp_parse_url( $url, PHP_URL_PATH );
		$p = $p ? untrailingslashit( $p ) : '';
		return $p ? $p : null;
	}

	private static function seo( $id ) {
		$title = get_post_meta( $id, '_yoast_wpseo_title', true );
		if ( ! $title ) {
			$title = get_post_meta( $id, 'rank_math_title', true );
		}
		$desc = get_post_meta( $id, '_yoast_wpseo_metadesc', true );
		if ( ! $desc ) {
			$desc = get_post_meta( $id, 'rank_math_description', true );
		}
		// Template variables (%%title%%, %sitename%) only mean something inside WordPress.
		$clean = function ( $s ) {
			return ( $s && false === strpos( $s, '%' ) ) ? wp_strip_all_tags( $s ) : null;
		};
		return array( 'title' => $clean( $title ), 'description' => $clean( $desc ) );
	}

	/** The page as visitors see it, so page-builder layouts (Elementor, Divi, WPBakery) come across as content. */
	private static function rendered( $post ) {
		if ( did_action( 'elementor/loaded' ) && class_exists( '\Elementor\Plugin' ) ) {
			$doc = \Elementor\Plugin::$instance->documents->get( $post->ID );
			if ( $doc && $doc->is_built_with_elementor() ) {
				return \Elementor\Plugin::$instance->frontend->get_builder_content_for_display( $post->ID, false );
			}
		}
		$GLOBALS['post'] = $post; // phpcs:ignore
		setup_postdata( $post );
		$html = apply_filters( 'the_content', $post->post_content );
		wp_reset_postdata();
		return $html;
	}

	/** Variations of a variable product (size, colour...), as Passive Coder variants. */
	private static function variants( $prod ) {
		if ( ! $prod->is_type( 'variable' ) ) {
			return array();
		}
		$out = array();
		foreach ( array_slice( $prod->get_children(), 0, 100 ) as $vid ) {
			$v = wc_get_product( $vid );
			if ( ! $v ) {
				continue;
			}
			$attrs = array();
			foreach ( $v->get_variation_attributes() as $k => $val ) {
				$attrs[ wc_attribute_label( str_replace( 'attribute_', '', $k ) ) ] = $val;
			}
			$regular = $v->get_regular_price();
			$sale    = $v->get_sale_price();
			$img     = $v->get_image_id() ? wp_get_attachment_url( $v->get_image_id() ) : '';
			$out[]   = array(
				'name'          => $attrs ? implode( ' / ', array_filter( array_values( $attrs ) ) ) : $v->get_name(),
				'sku'           => $v->get_sku(),
				'price'         => '' !== $sale ? (float) $sale : ( '' !== $regular ? (float) $regular : null ),
				'compare_price' => ( '' !== $sale && '' !== $regular ) ? (float) $regular : null,
				'stock'         => $v->managing_stock() ? (int) $v->get_stock_quantity() : null,
				'attributes'    => $attrs,
				'image'         => $img ? $img : null,
			);
		}
		return $out;
	}

	private static function batch( $type, $offset ) {
		$items = array();
		if ( 'menu' === $type ) {
			$menus = array_slice( wp_get_nav_menus(), $offset, self::BATCH );
			$locations = array_flip( array_filter( (array) get_nav_menu_locations() ) );
			foreach ( $menus as $m ) {
				$tree = array();
				$kids = array();
				foreach ( (array) wp_get_nav_menu_items( $m->term_id ) as $mi ) {
					$node = array( 'label' => html_entity_decode( $mi->title, ENT_QUOTES ), 'url' => $mi->url );
					if ( $mi->menu_item_parent ) {
						$kids[ $mi->menu_item_parent ][] = $node;
					} else {
						$tree[ $mi->ID ] = $node;
					}
				}
				foreach ( $kids as $parent => $children ) {
					if ( isset( $tree[ $parent ] ) ) {
						$tree[ $parent ]['children'] = $children;
					}
				}
				$items[] = array(
					'kind'     => 'menu',
					'name'     => $m->name,
					'location' => isset( $locations[ $m->term_id ] ) ? $locations[ $m->term_id ] : null,
					'items'    => array_values( $tree ),
				);
			}
			return array( $items, count( $menus ) );
		}
		if ( 'order' === $type && function_exists( 'wc_get_orders' ) ) {
			$orders = wc_get_orders( array( 'limit' => self::BATCH, 'offset' => $offset, 'orderby' => 'ID', 'order' => 'ASC', 'type' => 'shop_order' ) );
			foreach ( $orders as $o ) {
				$lines = array();
				foreach ( $o->get_items() as $li ) {
					$prod    = $li->get_product();
					$qty     = max( 1, (int) $li->get_quantity() );
					$lines[] = array(
						'name'     => $li->get_name(),
						'sku'      => $prod ? $prod->get_sku() : '',
						'quantity' => $qty,
						'price'    => round( (float) $li->get_total() / $qty, 2 ),
					);
				}
				$created = $o->get_date_created();
				$items[] = array(
					'kind'             => 'order',
					'number'           => (string) $o->get_order_number(),
					'date'             => $created ? $created->date( 'c' ) : null,
					'status'           => $o->get_status(),
					'payment_method'   => $o->get_payment_method_title(),
					'customer'         => array(
						'name'  => trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ),
						'email' => $o->get_billing_email(),
						'phone' => $o->get_billing_phone(),
					),
					'items'            => $lines,
					'subtotal'         => (float) $o->get_subtotal(),
					'discount'         => (float) $o->get_discount_total(),
					'shipping'         => (float) $o->get_shipping_total(),
					'tax'              => (float) $o->get_total_tax(),
					'total'            => (float) $o->get_total(),
					'billing_address'  => $o->get_address( 'billing' ),
					'shipping_address' => $o->get_address( 'shipping' ),
					'notes'            => $o->get_customer_note(),
				);
			}
			return array( $items, count( $orders ) );
		}
		if ( 'customer' === $type ) {
			$users = get_users( array( 'role' => 'customer', 'number' => self::BATCH, 'offset' => $offset, 'orderby' => 'ID' ) );
			foreach ( $users as $u ) {
				$items[] = array(
					'kind'       => 'contact',
					'first_name' => get_user_meta( $u->ID, 'billing_first_name', true ) ? get_user_meta( $u->ID, 'billing_first_name', true ) : $u->first_name,
					'last_name'  => get_user_meta( $u->ID, 'billing_last_name', true ) ? get_user_meta( $u->ID, 'billing_last_name', true ) : $u->last_name,
					'email'      => $u->user_email,
					'phone'      => get_user_meta( $u->ID, 'billing_phone', true ),
					'company'    => get_user_meta( $u->ID, 'billing_company', true ),
					'tags'       => array( 'woocommerce-customer' ),
				);
			}
			return array( $items, count( $users ) );
		}

		$posts = get_posts( array(
			'post_type'        => $type,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'posts_per_page'   => self::BATCH,
			'offset'           => $offset,
			'orderby'          => 'ID',
			'order'            => 'ASC',
			'suppress_filters' => true,
		) );
		foreach ( $posts as $p ) {
			$old = 'publish' === $p->post_status ? self::path( get_permalink( $p ) ) : null;
			if ( 'product' === $type && function_exists( 'wc_get_product' ) ) {
				$prod = wc_get_product( $p->ID );
				if ( ! $prod ) {
					continue;
				}
				$images = array();
				foreach ( array_merge( array( $prod->get_image_id() ), $prod->get_gallery_image_ids() ) as $img ) {
					$u = $img ? wp_get_attachment_url( $img ) : '';
					if ( $u ) {
						$images[] = $u;
					}
				}
				$regular = $prod->get_regular_price();
				$sale    = $prod->get_sale_price();
				$price   = '' !== $sale ? $sale : ( '' !== $regular ? $regular : $prod->get_price() );
				$items[] = array(
					'kind'              => 'product',
					'name'              => $prod->get_name(),
					'slug'              => $prod->get_slug(),
					'html'              => $prod->get_description(),
					'short_description' => wp_strip_all_tags( $prod->get_short_description() ),
					'price'             => '' !== $price ? (float) $price : null,
					'compare_price'     => ( '' !== $sale && '' !== $regular ) ? (float) $regular : null,
					'sku'               => $prod->get_sku(),
					'stock'             => $prod->managing_stock() ? (int) $prod->get_stock_quantity() : null,
					'images'            => $images,
					'seo'               => self::seo( $p->ID ),
					'old_path'          => $old,
					'variants'          => self::variants( $prod ),
				);
				continue;
			}
			$thumb   = get_the_post_thumbnail_url( $p, 'full' );
			$items[] = array(
				'kind'           => $type,
				'title'          => html_entity_decode( get_the_title( $p ), ENT_QUOTES ),
				'slug'           => $p->post_name ? $p->post_name : sanitize_title( $p->post_title ),
				'html'           => self::rendered( $p ),
				'excerpt'        => $p->post_excerpt ? wp_strip_all_tags( $p->post_excerpt ) : null,
				'date'           => $p->post_date_gmt,
				'featured_image' => $thumb ? $thumb : null,
				'seo'            => self::seo( $p->ID ),
				'old_path'       => $old,
			);
		}
		return array( $items, count( $posts ) );
	}

	/* ── AJAX (driven by the admin page) ──────────────────────────────── */

	public static function ajax_hello() {
		self::guard();
		self::reply( self::remote( array( 'action' => 'hello' ) ) );
	}

	public static function ajax_start() {
		self::guard();
		$r = self::remote( array( 'action' => 'start', 'source_label' => home_url() ) );
		if ( is_wp_error( $r ) ) {
			self::reply( $r );
		}
		update_option( self::OPT_JOB, $r['job'], false );
		$selected = isset( $_POST['types'] ) ? array_map( 'sanitize_key', (array) wp_unslash( $_POST['types'] ) ) : array();
		$counts   = array();
		foreach ( array_keys( self::types() ) as $t ) {
			if ( in_array( $t, $selected, true ) ) {
				$counts[ $t ] = self::count_type( $t );
			}
		}
		self::reply( array( 'job' => $r['job'], 'counts' => $counts ) );
	}

	public static function ajax_push() {
		self::guard();
		$type   = isset( $_POST['type'] ) ? sanitize_key( wp_unslash( $_POST['type'] ) ) : '';
		$offset = isset( $_POST['offset'] ) ? absint( $_POST['offset'] ) : 0;
		if ( ! array_key_exists( $type, self::types() ) ) {
			self::reply( new WP_Error( 'pcmig', 'Unknown type' ) );
		}
		list( $items, $read ) = self::batch( $type, $offset );
		if ( $items ) {
			$r = self::remote( array( 'action' => 'items', 'job' => get_option( self::OPT_JOB ), 'items' => $items ) );
			if ( is_wp_error( $r ) ) {
				self::reply( $r );
			}
		}
		self::reply( array( 'read' => $read, 'done' => $read < self::BATCH ) );
	}

	public static function ajax_step() {
		self::guard();
		self::reply( self::remote( array( 'action' => 'step', 'job' => get_option( self::OPT_JOB ) ) ) );
	}

	/* ── Settings + admin page ────────────────────────────────────────── */

	public static function save() {
		if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'pcmig_save' ) ) {
			wp_die( 'Not allowed' );
		}
		$key = isset( $_POST['pcmig_key'] ) ? trim( sanitize_text_field( wp_unslash( $_POST['pcmig_key'] ) ) ) : '';
		if ( '' !== $key ) {
			update_option( self::OPT_KEY, $key, false );
		}
		$endpoint = isset( $_POST['pcmig_endpoint'] ) ? esc_url_raw( wp_unslash( $_POST['pcmig_endpoint'] ) ) : '';
		update_option( self::OPT_ENDPOINT, $endpoint ? $endpoint : self::DEFAULT_ENDPOINT, false );
		wp_safe_redirect( admin_url( 'tools.php?page=passive-coder-migration&saved=1' ) );
		exit;
	}

	public static function page() {
		$has_key = (bool) get_option( self::OPT_KEY );
		$types   = self::types();
		?>
		<div class="wrap">
			<h1>Passive Coder Migration</h1>
			<p>Copies this site's content to your Passive Coder site. Nothing here is changed or deleted, and you can run it again any time.</p>

			<h2>1. Connect</h2>
			<p>In your Passive Coder dashboard open <strong>Import / Export</strong>, click <strong>Create migration key</strong> and paste it below.</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="pcmig_save" />
				<?php wp_nonce_field( 'pcmig_save' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="pcmig_key">Migration key</label></th>
						<td><input name="pcmig_key" id="pcmig_key" type="password" class="regular-text" autocomplete="off" placeholder="<?php echo $has_key ? esc_attr( 'Saved. Paste a new key to replace it.' ) : 'pcm_...'; ?>" /></td>
					</tr>
					<tr>
						<th scope="row"><label for="pcmig_endpoint">Server</label></th>
						<td><input name="pcmig_endpoint" id="pcmig_endpoint" type="url" class="regular-text" value="<?php echo esc_attr( get_option( self::OPT_ENDPOINT, self::DEFAULT_ENDPOINT ) ); ?>" />
						<p class="description">Leave as is unless Passive Coder support asks you to change it.</p></td>
					</tr>
				</table>
				<?php submit_button( 'Save key' ); ?>
			</form>

			<?php if ( $has_key ) : ?>
			<h2>2. Migrate</h2>
			<p id="pcmig-hello">Checking connection…</p>
			<fieldset id="pcmig-types">
				<?php foreach ( $types as $k => $label ) : ?>
					<label style="margin-right:16px"><input type="checkbox" value="<?php echo esc_attr( $k ); ?>" checked /> <?php echo esc_html( $label ); ?> (<?php echo (int) self::count_type( $k ); ?>)</label>
				<?php endforeach; ?>
			</fieldset>
			<p><button type="button" class="button button-primary" id="pcmig-go" disabled>Start migration</button></p>
			<div id="pcmig-progress" style="display:none;max-width:600px">
				<div style="background:#dcdcde;border-radius:4px;height:10px;overflow:hidden"><div id="pcmig-bar" style="background:#2271b1;height:10px;width:0"></div></div>
				<p id="pcmig-status"></p>
			</div>
			<p class="description">Pages and posts arrive as drafts so you can review them before publishing. Old links on this site are redirected to the new pages once your domain points to Passive Coder.</p>
			<script>
			(function () {
				var ajax = <?php echo wp_json_encode( admin_url( 'admin-ajax.php' ) ); ?>;
				var nonce = <?php echo wp_json_encode( wp_create_nonce( 'pcmig' ) ); ?>;
				var $ = function (id) { return document.getElementById(id); };
				function call(action, data) {
					var body = new URLSearchParams(Object.assign({ action: 'pcmig_' + action, nonce: nonce }, data || {}));
					(data && data.types || []).forEach(function (t) { body.append('types[]', t); });
					body.delete('types');
					return fetch(ajax, { method: 'POST', credentials: 'same-origin', body: body })
						.then(function (r) { return r.json(); })
						.then(function (r) { if (!r.success) throw new Error((r.data && r.data.message) || 'Request failed'); return r.data; });
				}
				function status(t, pct) { $('pcmig-status').textContent = t; if (pct != null) $('pcmig-bar').style.width = pct + '%'; }

				call('hello').then(function (r) {
					$('pcmig-hello').textContent = 'Connected to ' + r.site + (r.address ? ' (' + r.address + ')' : '') + '.';
					$('pcmig-go').disabled = false;
				}).catch(function (e) { $('pcmig-hello').textContent = 'Not connected: ' + e.message; });

				$('pcmig-go').addEventListener('click', async function () {
					var types = Array.prototype.slice.call(document.querySelectorAll('#pcmig-types input:checked')).map(function (i) { return i.value; });
					if (!types.length) return;
					this.disabled = true;
					$('pcmig-progress').style.display = 'block';
					try {
						var s = await call('start', { types: types });
						var total = 0, sent = 0;
						Object.keys(s.counts).forEach(function (k) { total += s.counts[k]; });
						for (var i = 0; i < types.length; i++) {
							var offset = 0;
							for (;;) {
								var r = await call('push', { type: types[i], offset: offset });
								offset += r.read; sent += r.read;
								status('Sending content: ' + sent + ' / ' + total, total ? Math.round(sent / total * 50) : 50);
								if (r.done) break;
							}
						}
						for (;;) {
							var p = await call('step');
							status('Importing on Passive Coder: ' + p.cursor + ' / ' + p.total + ' (' + p.results.media + ' images copied)', 50 + (p.total ? Math.round(p.cursor / p.total * 50) : 50));
							if (p.status === 'done') {
								status('Done. ' + p.results.created + ' added, ' + p.results.skipped + ' skipped, ' + p.results.failed + ' failed, ' + p.results.media + ' images copied. Review the drafts in your Passive Coder dashboard.', 100);
								break;
							}
						}
					} catch (e) {
						status('Stopped: ' + e.message + ' You can resume it from Import / Export in your Passive Coder dashboard.');
					}
					this.disabled = false;
				});
			})();
			</script>
			<?php endif; ?>
		</div>
		<?php
	}
}

PCMig::init();
