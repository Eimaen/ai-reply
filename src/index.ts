/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injector, Logger, common, settings, webpack } from "replugged";
import { Channel, Message } from "discord-types/general";

import { Icon } from "./AiButton";
import getSettingsPage from "./Settings";

const logger = Logger.plugin("AiReply");
const injector = new Injector();

interface Settings {
  initialPrompt?: string;
  openAiToken?: string;
}

const cfg = await settings.init<Settings>("pw.eimaen.AIReply");

export async function start(): Promise<void> {
  const mod = await webpack.waitForModule(
    webpack.filters.bySource(
      'document.queryCommandEnabled("copy")||document.queryCommandSupported("copy")',
    ),
  );

  const getMessageByReference = (await webpack.waitForProps("getMessageByReference")) as {
    getMessageByReference: (
      t: { guild_id?: string; channel_id: string; message_id: string } | undefined,
    ) => { state: number; message: Message };
  };
  const myId: string = ((await webpack.waitForProps("getId")) as { getId: () => string }).getId();

  injector.utils.addPopoverButton((msg: Message, _: Channel) => {
    return {
      key: "aireply",
      label: "Click here to generate a reply.",
      icon: Icon,
      onClick: async () => {
        let messageChain: Message[] = [];
        let currentMessage: Message = msg;
        messageChain.push(msg);
        while (currentMessage.messageReference) {
          currentMessage = getMessageByReference.getMessageByReference(
            currentMessage.messageReference,
          ).message;
          messageChain.push(currentMessage);
        }
        let chatGptRequest: {
          model: string;
          messages: Array<{
            role: string;
            content: string;
          }>;
        } = {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: cfg.get("initialPrompt"),
            },
            ...messageChain
              .slice(0, 5)
              .reverse()
              .map((message) => ({
                role: message.author.id == myId ? "assistant" : "user",
                content: message.content,
              })),
          ],
        };
        common.toast.toast("Message has been sent to ChatGPT...", common.toast.Kind.SUCCESS);
        logger.log(chatGptRequest);
        const chatGptResponse = await (
          await fetch(`https://api.openai.com/v1/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${cfg.get("openAiToken")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(chatGptRequest),
          }).catch((err) => {
            logger.error(err);
          })
        )?.json();
        logger.log(chatGptResponse);
        let copy = Object.values(mod).find((e) => typeof e === "function") as (
          args: string,
        ) => void;
        copy(chatGptResponse.choices[0].message.content);
        common.toast.toast(
          "AI Response has been copied to clipboard...",
          common.toast.Kind.SUCCESS,
        );
      },
    };
  });
}

export function stop(): void {
  injector.uninjectAll();
}

export function Settings(): React.ReactElement {
  return getSettingsPage();
}
