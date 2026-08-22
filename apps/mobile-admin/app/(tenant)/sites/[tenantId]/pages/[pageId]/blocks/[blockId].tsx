import { useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { usePageEdit } from "../../../../../../../lib/pageEditContext";
import type { Block } from "../../../../../../../lib/types";
import { BlockFieldEditor } from "../../../../../../../components/BlockFieldEditor";
import { Button, ErrorText, Field, Select } from "../../../../../../../components/form";
import { Card, LoadingSpinner, Screen } from "../../../../../../../components/ui";

// Confirmed against src/types/cms.ts's BlockWidth type: "full" | "wide" |
// "normal" | "narrow" — "full" is baseBlock()'s default.
const WIDTH_OPTIONS = [
  { label: "Full width", value: "full" },
  { label: "Wide", value: "wide" },
  { label: "Normal", value: "normal" },
  { label: "Narrow", value: "narrow" },
];

export default function BlockDetailScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string; tenantId: string; pageId: string }>();
  const { page, loading, error, setBlocks } = usePageEdit();

  const blockIndex = useMemo(
    () => page?.blocks?.findIndex((b) => b.id === blockId) ?? -1,
    [page, blockId]
  );
  const block = blockIndex >= 0 ? page!.blocks[blockIndex] : null;

  const [local, setLocal] = useState<Block | null>(block);

  // Keep local state in sync if the underlying page/block changes out from
  // under us (e.g. after a reload) without clobbering in-progress edits on
  // first mount.
  if (local === null && block) {
    setLocal(block);
  }

  function saveAndBack() {
    if (!page || !local || blockIndex < 0) return;
    const next = page.blocks.slice();
    next[blockIndex] = local;
    setBlocks(next);
    router.back();
  }

  if (loading) return <LoadingSpinner />;
  if (!page || !local) {
    return (
      <Screen>
        <ErrorText>{error ?? "Block not found"}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Field label="Block type">
          <Text style={{ fontSize: 14, fontWeight: "700" }}>{local.type}</Text>
        </Field>
        <Field label="Visible">
          <Select
            value={local.visible ? "true" : "false"}
            placeholder="Visible"
            options={[
              { label: "Visible", value: "true" },
              { label: "Hidden", value: "false" },
            ]}
            onChange={(v) => setLocal({ ...local, visible: v === "true" })}
          />
        </Field>
        <Field label="Width">
          <Select
            value={local.width}
            placeholder="Width"
            options={WIDTH_OPTIONS}
            onChange={(v) => setLocal({ ...local, width: v })}
          />
        </Field>
        {/* v1.5 gap: padding/margin/background/animation editing are not
           exposed here yet — advanced/rarely touched, per task scope. */}
      </Card>

      <Card style={{ gap: 14 }}>
        <BlockFieldEditor
          data={local.data}
          onChange={(data) => setLocal({ ...local, data })}
        />
      </Card>

      <Button
        title="Save"
        onPress={() => {
          saveAndBack();
          Alert.alert("Updated", "Block updated locally — remember to Save changes on the Blocks screen.");
        }}
      />
    </Screen>
  );
}
