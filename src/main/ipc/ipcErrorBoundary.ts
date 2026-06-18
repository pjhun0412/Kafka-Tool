import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { logMainError } from "../logger.js";

type IpcHandler<TArgs extends unknown[], TResult> = (
  event: IpcMainInvokeEvent,
  ...args: TArgs
) => Promise<TResult> | TResult;

export function handleLogged<TArgs extends unknown[], TResult>(
  channel: string,
  handler: IpcHandler<TArgs, TResult>
) {
  ipcMain.handle(channel, async (event, ...args: TArgs) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      logMainError(`ipc.${channel}`, error);
      throw error;
    }
  });
}
