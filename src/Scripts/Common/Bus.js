define(["require", "exports"], function(require, exports) {
    var Bus = (function () {
        function Bus() {
            this.channels = [];
        }
        Bus.prototype.subscribe = function (channel, fn) {
            if (!this.channels[channel])
                this.channels[channel] = [];
            this.channels[channel].push({ context: this, callback: fn });
            return this;
        };

        Bus.prototype.publish = function (channel) {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                args[_i] = arguments[_i + 1];
            }
            if (!this.channels[channel])
                throw "Channel does not exist";
            this.channels[channel].forEach(function (x) {
                x.callback.apply(x.context, args);
            });
            return this;
        };

        Bus.prototype.installTo = function (obj) {
            var _this = this;
            obj.subscribe = function (channel, fn) {
                _this.subscribe.call(_this, channel, function () {
                    fn.apply(obj, arguments);
                });
                return obj;
            };
            obj.publish = function () {
                _this.publish.apply(_this, arguments);
                return obj;
            };
        };
        return Bus;
    })();
    exports.Bus = Bus;
});
//# sourceMappingURL=Bus.js.map
