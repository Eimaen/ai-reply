import { components, util } from "replugged";
import { ReactElement } from "react";
import { cfg } from ".";

const { FormItem, TextInput, TextArea, SliderItem, SwitchItem } = components;

export default function Settings(): ReactElement {
  return (
    <div>
      <FormItem title="AI Prompt" style={{ marginBottom: "10px" }}>
        <TextArea {...util.useSetting(cfg, "initialPrompt", "")} />
      </FormItem>
      <FormItem title="OpenAI API Token" style={{ marginBottom: "10px" }}>
        <TextInput {...util.useSetting(cfg, "openAiToken", "")} />
      </FormItem>
      <SliderItem
        {...util.useSetting(cfg, "keepContext", 5)}
        minValue={1}
        maxValue={25}
        stickToMarkers={true}
        markers={[1, 5, 10, 15, 20, 25]}>
        Keep context of N messages
      </SliderItem>
      <SwitchItem {...util.useSetting(cfg, "ignoreReplyChains", false)}>
        Don't use reply chains when not in DM channel
      </SwitchItem>
      <SwitchItem {...util.useSetting(cfg, "manualContext", false)}>
        Use manual context selection
      </SwitchItem>
    </div>
  );
}
