import cjs from "./script.js";

const api = (cjs && typeof cjs === "object") ? cjs : {};
const createSEALessonMap = api.createSEALessonMap || api.default;

export { createSEALessonMap };
export default createSEALessonMap;
