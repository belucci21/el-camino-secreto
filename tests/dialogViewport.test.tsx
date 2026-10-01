import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useDialogViewport } from "../src/hooks/useDialogViewport";

function DialogViewport() { useDialogViewport(true); return null; }
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it("fits dialogs to the visible keyboard viewport and removes listeners on close", () => {
  const viewport = Object.assign(new EventTarget(), {height: 720, offsetTop:0});
  vi.stubGlobal("visualViewport", viewport);
  const {unmount} = render(<DialogViewport />);
  expect(document.documentElement.style.getPropertyValue("--journey-dialog-height")).toBe("720px");
  act(() => { viewport.height = 320; viewport.offsetTop = 48; viewport.dispatchEvent(new Event("resize")); });
  expect(document.documentElement.style.getPropertyValue("--journey-dialog-height")).toBe("320px");
  expect(document.documentElement.style.getPropertyValue("--journey-dialog-top")).toBe("48px");
  unmount();
  expect(document.documentElement.style.getPropertyValue("--journey-dialog-height")).toBe("");
  viewport.dispatchEvent(new Event("resize"));
  expect(document.documentElement.style.getPropertyValue("--journey-dialog-height")).toBe("");
});
