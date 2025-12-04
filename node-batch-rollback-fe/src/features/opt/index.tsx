import React from "react";
import { createRoot } from "react-dom/client";
import OptForm from "./form";
import sdk from "../../sdk";


const container = document.createElement("div");
container.id = "app";
container.style.position = "relative";
document.body.appendChild(container);
sdk.Context.load().then((ctx) => {
  document.body.setAttribute("theme-mode", ctx.colorScheme);
});
window.JSSDK.utils.overwriteThemeForSemiUI();
const root = createRoot(container);
root.render(<OptForm from="pc" />);
