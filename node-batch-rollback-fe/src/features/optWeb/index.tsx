import React from "react";
import { createRoot } from "react-dom/client";
import OptForm from "../opt/form";
import { DEVICE_TYPE_KEY } from '../../constants';
import { setStorage } from '../../utils';
import sdk from "../../sdk";


const container = document.createElement("div");
container.id = "app";
container.style.position = "relative";
document.body.appendChild(container);
sdk.Context.load().then((ctx) => {
  document.body.setAttribute("theme-mode", ctx.colorScheme);
});
Promise.resolve().then(async () => {
  await setStorage(DEVICE_TYPE_KEY, 'mobile');
  const root = createRoot(container);
  root.render(<OptForm from="mobile" />);
});
