import { components, util } from "replugged";
import { cfg } from ".";

const { FormItem, TextInput, TextArea, SliderItem, SwitchItem } = components;

export default function Settings(): React.ReactElement {
  return (
    <div>
      <FormItem title="AI Prompt" style={{ marginBottom: "10px" }}>
        <TextArea {...util.useSetting(cfg, "initialPrompt", "")} rows={25} />
      </FormItem>
      <FormItem title="OpenAI API Token" style={{ marginBottom: "10px" }}>
        <TextInput {...util.useSetting(cfg, "openAiToken", "")} />
      </FormItem>
      <SliderItem
        {...util.useSetting(cfg, "keepContext", 5)}
        minValue={1}
        maxValue={25}
        stickToMarkers={true}
        markers={[1, 5, 10, 15, 20, 25]}
        note="The limit of messages to be included into the ChatGPT context.">
        Keep context of N messages
      </SliderItem>
      <SwitchItem
        {...util.useSetting(cfg, "ignoreReplyChains", false)}
        note="When used in guild channels, by default, when manual context selection is disabled, plugin uses reply chains to get the context. It means, the target message, the message the target message was a reply on, reply on another reply and so on...">
        Don't use reply chains when not in DM channel
      </SwitchItem>
      <SwitchItem
        {...util.useSetting(cfg, "manualContext", true)}
        note="Allows you to choose the messages included into context by yourself (buggy). Right-click the OpenAI tooltip button to add/remove message from the context.">
        Use manual context selection
      </SwitchItem>
    </div>
  );
}
