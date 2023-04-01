import { components, settings, util } from "replugged";
import { ReactElement } from 'react';
const { FormItem, TextInput, TextArea } = components;

const cfg = await settings.init("pw.eimaen.AIReply");

export default function Settings(): ReactElement {
  return (
    <div>
      <FormItem title="AI Prompt" style={{ marginBottom: '10px' }}>
        <TextArea {...util.useSetting(cfg, "initialPrompt", "")} />
      </FormItem>
      <FormItem title="OpenAI API Token" style={{ marginBottom: '10px' }}>
        <TextInput {...util.useSetting(cfg, "openAiToken", "")} />
      </FormItem>
    </div>
  );
}
