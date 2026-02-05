export var modelJson = function () {
    return import("../models/mobilenet_v2_mid/model.min.js");
};
export var weightBundles = [
    function () { return import("../models/mobilenet_v2_mid/group1-shard1of2.min.js"); },
    function () { return import("../models/mobilenet_v2_mid/group1-shard2of2.min.js"); },
];
//# sourceMappingURL=mobilenet_v2_mid.js.map