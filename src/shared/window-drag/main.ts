/**
 * https://github.com/electron/electron/issues/1354#issuecomment-1356330873
 */

import {BrowserWindow, ipcMain } from "electron";
import * as process from "node:process";
import debounce from "@/common/debounce";

const WM_MOUSEMOVE = 0x0200; // https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mousemove
const WM_LBUTTONUP = 0x0202; // https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-lbuttonup

const MK_LBUTTON = 0x0001;

interface IDragOptions {
    width: number;
    height: number;
    getWindowSize?: () => ICommon.ISize;
    onDragEnd: (position: ICommon.IPoint | null) => void;
}

const makeWin32WindowFullyDraggable = (
    browserWindow: BrowserWindow,
    options: IDragOptions
): void => {
    const {height, width, getWindowSize, onDragEnd} = options;
    const initialPos = {
        x: 0,
        y: 0,
        height,
        width,
    };

    let dragging = false;
    let cachePosition: ICommon.IPoint | null = null;

    browserWindow.hookWindowMessage(WM_LBUTTONUP, () => {
        dragging = false;
        if (cachePosition !== null) {
            onDragEnd(cachePosition);
        }
        cachePosition = null;
    });
    browserWindow.hookWindowMessage(
        WM_MOUSEMOVE,
        (wParam: Buffer, lParam: Buffer) => {
            if (!browserWindow) {
                return;
            }

            const wParamNumber: number = wParam.readInt16LE(0);

            if (!(wParamNumber & MK_LBUTTON)) {
                // <-- checking if left mouse button is pressed
                return;
            }

            const x = lParam.readInt16LE(0);
            const y = lParam.readInt16LE(2);
            if (!dragging) {
                dragging = true;

                let initWidth = width;
                let initHeight = height;
                if (getWindowSize) {
                    const size = getWindowSize();
                    initWidth = size.width;
                    initHeight = size.height;
                }

                initialPos.x = x;
                initialPos.y = y;
                initialPos.height = initHeight;
                initialPos.width = initWidth;
                return;
            }

            cachePosition = {
                x: x + browserWindow.getPosition()[0] - initialPos.x,
                y: y + browserWindow.getPosition()[1] - initialPos.y,
            };
            browserWindow.setBounds({
                x: cachePosition.x,
                y: cachePosition.y,
                height: initialPos.height,
                width: initialPos.width,
            });
        }
    );
};


class WindowDrag {
    private registeredWindows = new Map<BrowserWindow, IDragOptions>();

    setup(): void {
        ipcMain.on("set-window-draggable", (_evt, position) => {
            const window = BrowserWindow.fromWebContents(_evt.sender)
            if (this.registeredWindows.has(window)) {
                const metadata = this.registeredWindows.get(window);
                let width = metadata.width;
                let height = metadata.height;
                if (metadata.getWindowSize) {
                    const size = metadata.getWindowSize();
                    width = size.width;
                    height = size.height;
                }
                window.setBounds({
                    x: position.x,
                    y: position.y,
                    height: height,
                    width: width
                });
                metadata.onDragEnd?.(position);
            }
        })
    }

    setWindowDraggable(window: BrowserWindow, options: IDragOptions): void {
        if (process.platform === "win32") {
            makeWin32WindowFullyDraggable(window, options);
        } else {
            const originalDragEnd = options.onDragEnd;
            options.onDragEnd = debounce((position: ICommon.IPoint | null) => {
                originalDragEnd?.(position);
            }, 300, {
                leading: false,
                trailing: true
            })
            this.registeredWindows.set(window, options);
            window.on("closed", () => {
                this.registeredWindows.delete(window);
            })
        }

    }
}

export default new WindowDrag();
