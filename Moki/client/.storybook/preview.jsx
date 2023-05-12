import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import "font-awesome/css/font-awesome.min.css";
import "@/styles/style.scss";
import "@/gui/src/style/style.css";
import "@/App.css";

const colorPrimary = "#58a959";
const colorSecondary = "#58a959";

const WithColorScheme = (StoryFn) => {
  document.body.style.setProperty("--main", colorPrimary);
  document.body.style.setProperty("--second", colorSecondary);
  return <StoryFn />;
};

export const decorators = [WithColorScheme];

/** @type { import('@storybook/react').Preview } */
const preview = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export default preview;
