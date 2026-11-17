import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RedirectsManager } from "@/components/admin/redirects-manager";

export default function RedirectsPage() {
  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Redirects &amp; short links</h1>
        <p className="text-sm text-muted-foreground mt-1">Send one address to another: short links for ads and WhatsApp (/offer), old addresses after a page moved, or links out to another website.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your redirects</CardTitle>
          <CardDescription>Visitors and Google go straight to the destination. Changes take up to a minute to apply everywhere.</CardDescription>
        </CardHeader>
        <CardContent><RedirectsManager /></CardContent>
      </Card>
    </div>
  );
}
