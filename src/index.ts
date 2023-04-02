/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injector, Logger, common, settings, webpack } from "replugged";
import { Channel, Message, User } from "discord-types/general";
const { React } = common;

import { Icon } from "./AiButton";
import { ToggleContextIcon } from "./AiContextButton";
import { IconMessage } from "./AiMessageIcon";
import getSettingsPage from "./Settings";

const logger = Logger.plugin("AiReply");
const injector = new Injector();

interface Settings {
  initialPrompt?: string;
  openAiToken?: string;
  keepContext?: number;
  ignoreReplyChains?: boolean;
  manualContext?: boolean;
}

const defaultSettings: Partial<Settings> = {
  initialPrompt: "",
  openAiToken: "",
  keepContext: 5,
  ignoreReplyChains: false,
  manualContext: true,
};

export const cfg = await settings.init<Settings>("pw.eimaen.AIReply", defaultSettings);

export async function start(): Promise<void> {
  let contextMessages: string[] = [];

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

  const moduleMessageWrapper = await webpack.waitForModule<{
    Z: (
      ...args: Array<{
        decorations: React.ReactElement[][];
        message: Message;
        author: User;
        channel: Channel;
      }>
    ) => unknown;
  }>(webpack.filters.bySource('"BADGES"'));

  injector.utils.addPopoverButton((msg: Message, chan: Channel) => {
    return {
      key: "aireply",
      label: "[Left Click] here to generate a reply, [Right Click] add a message to context",
      icon: Icon,
      onClick: async () => {
        let messageChain: Message[] = [];
        if (cfg.get("manualContext")) {
          messageChain.push(msg);
          let messages = (
            common.messages.getMessages(chan.id) as unknown as { _array: Message[] }
          )._array.map((a) => a);
          messages
            .reverse()
            .filter((m) => contextMessages.includes(m.id) && m.timestamp < msg.timestamp)
            .forEach((m) => messageChain.push(m));
        } else if (chan.isDM() || cfg.get("ignoreReplyChains")) {
          let messages = (
            common.messages.getMessages(chan.id) as unknown as { _array: Message[] }
          )._array.map((a) => a);
          messages
            .reverse()
            .filter((m) => m.timestamp < msg.timestamp)
            .forEach((m) => messageChain.push(m));
        } else {
          let currentMessage: Message = msg;
          messageChain.push(msg);
          while (currentMessage.messageReference) {
            currentMessage = getMessageByReference.getMessageByReference(
              currentMessage.messageReference,
            ).message;
            messageChain.push(currentMessage);
          }
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
              .slice(0, cfg.get("keepContext"))
              .reverse()
              .map((message) => ({
                role: message.author.id == myId ? "assistant" : "user",
                content: message.content,
              })),
          ],
        };
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
      onContextMenu: () => {
        if (contextMessages.includes(msg.id) ?? false)
          contextMessages.splice(contextMessages.indexOf(msg.id), 1);
        else contextMessages.push(msg.id);
      },
    };
  });

  injector.after(moduleMessageWrapper, "Z", ([args], res: React.ReactElement) => {
    if (contextMessages.includes(args.message.id))
      res?.props?.children[3]?.props?.children?.splice(1, 0, React.createElement(IconMessage));
    return res;
  });
}

export function stop(): void {
  injector.uninjectAll();
}

export function Settings(): React.ReactElement {
  return getSettingsPage();
}
