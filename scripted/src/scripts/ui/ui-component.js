(function() {
    var saveProto = Function.prototype
    , p, fullProto = function () {}

    , callAll = function(comp, preOrder, postOrder, args) {
        var internal = function(componentClass) {
            if (preOrder 
                && componentClass.hasOwnProperty(preOrder)
                && (typeof componentClass[preOrder] === "function")) {
                (componentClass[preOrder]).apply(comp, args);
            }
            if (componentClass !== Exhibit.UIComponent) {
                internal(componentClass.superClass);
            }
            if (postOrder 
                && componentClass.hasOwnProperty(postOrder)
                && (typeof componentClass[postOrder] === "function")) {
                (componentClass[postOrder]).apply(comp, args);
            }
        };
        args = args || [];
        internal(comp.constructor);
    }

    , settingsHelper = function(comp, collector) {
        var internalCollect = function(componentClass) {
            if (componentClass._settingSpecs) {
                //collect extenders settings *first*
                //so can override the class being extended
                //this means extended class may re-collect the value
                //which is fine unless the valuetype is changed
                //but that will break the extended class
                //better TODO: merge settings before collecting
                collector(componentClass._settingsSpecs);
            }
            if (componentClass !== Exhibit.UIComponent) {
                internalCollect(componentClass.superClass);
            }
        };
        internalCollect(comp.constructor);
    }

    , uiComponentMethods = {
        createFromDOM:  function(configElmt, containerElmt, uiContext) {
            var component = new this(containerElmt ?
                                     containerElmt : configElmt, 
                                     uiContext)
            , inlineConfig = Exhibit.getConfigurationFromDOM(configElmt)
            , settings = component._settings;
            settingsHelper(component, function(specs) {
                Exhibit.SettingsUtilities.collectSettingsFromDOM(
                    configElmt, specs, settings);
            });
            //now override collecting settings with inline config
            settingsHelper(component, function(specs) {
                Exhibit.SettingsUtilities.collectSettings(
                    inlineConfig, specs, settings);
            });
            callAll(component, null,"_configure", 
                    [configElmt, containerElmt, uiContext]);
            return component;
        },

        createFromObject: function(config, containerElmt, uiContext) {
            var component = new this(containerElmt, uiContext)
            , settings = component._settings;
            settingsHelper(component, function(specs, settings) {
                Exhibit.SettingsUtilities.collectSettings(
                    config, specs, settings);
            });
            callAll(component, null,"_configure",[containerElmt, uiContext]);
            return component;
        }
    };

    Exhibit.UIComponent = function () {};
    Exhibit.UIComponent.makeUIComponent = function(superComp, f) {
        var p;
        for (p in uiComponentMethods) {
            if (uiComponentMethods.hasOwnProperty(p)) {
                f[p] = uiComponentMethods[p];
            }
        }
        f.prototype = new superComp ();
        f.prototype.constructor = f;
        f.superClass = superComp;
        return f;
    };
})();