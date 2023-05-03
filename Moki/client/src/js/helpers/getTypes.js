import store from "@/js/store";

export const getTypes = () => {
    const { types } = store.getState().filter;

    const total = types.length;
    const typesResult = types.filter((type) => type.state !== "disable");
    const disableCount = total - typesResult.length;

    //all types are disabled = special NOT TYPE filter
    if (disableCount === total && total !== 0) {
        return "type:none";
    }

    return typesResult;
}