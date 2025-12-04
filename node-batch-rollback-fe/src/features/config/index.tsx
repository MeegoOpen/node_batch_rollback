import React from "react";
import { createRoot } from "react-dom/client";
import Config from "./conf";
import {getProjectKey} from "../../utils";
import sdk from "../../sdk";

window.JSSDK.utils.overwriteThemeForSemiUI();
const container = document.createElement("div");
container.id = "app";
container.style.position = "relative";
document.body.appendChild(container);
sdk.Context.load().then((ctx) => {
  document.body.setAttribute("theme-mode", ctx.colorScheme);
});
Promise.resolve().then(async () => {
  const root = createRoot(container);
  const spaceId = await getProjectKey();
  if (!spaceId) return;
  root.render(<Config spaceId={spaceId} />);
});
