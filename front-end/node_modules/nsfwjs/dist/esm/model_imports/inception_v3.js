export var modelJson = function () {
    return import("../models/inception_v3/model.min.js");
};
export var weightBundles = [
    function () { return import("../models/inception_v3/group1-shard1of6.min.js"); },
    function () { return import("../models/inception_v3/group1-shard2of6.min.js"); },
    function () { return import("../models/inception_v3/group1-shard3of6.min.js"); },
    function () { return import("../models/inception_v3/group1-shard4of6.min.js"); },
    function () { return import("../models/inception_v3/group1-shard5of6.min.js"); },
    function () { return import("../models/inception_v3/group1-shard6of6.min.js"); },
];
//# sourceMappingURL=inception_v3.js.map