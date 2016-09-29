var lgLanguagePicker = angular.module('lgLanguagePicker',
	['style-sheet-factory','popup-directive']);

lgLanguagePicker.directive('lgLanguagePicker', function() {
	return {
		restrict: 'EA',
		require: 'ngModel',
		scope: {
			choices: '@',
			ngModel: '='
		},
		controller: function($scope, $http) {
			$http.get('lg-language-picker/data.json').success(function(data) {
				$scope.allLanguageData = data;
				for (languageCode of $scope.languageCodeToChoseFrom) {
					for (languageData of $scope.allLanguageData) {
						if (languageData.code == languageCode) {
							languageData.show = true;
						}
					}
				}
			});
			$scope.addAttributesToScope = function(choices) {
				$scope.languageCodeToChoseFrom = choices.split(',');
			};
			$scope.chooseButtonText = 'Choisir langue';
		},
		templateUrl: function(elem, attr) {
			return 'lg-language-picker/template.html'
		},
		link: function(scope, element, attrs, ctrl) {
			scope.addAttributesToScope(attrs.choices);
			scope.updateModel = function(code, name) {
					ctrl.$modelValue = code;
					scope.ngModel = code;
					scope.chooseButtonText = name;
			};

			scope.updateView = function(value) {
				ctrl.$viewValue = value;
				ctrl.$render();
				console.log(ctrl);
			}
    }
	};
});

/***********************************************************************
Style Sheet Factory
Author: Brenton Klik
Prerequisites: AngularJS
Description:
This factory provides a series of methods to make management of CSS
styles in javascript easier. Directives may take advantage of these
to include thier CSS as part of their code, rather than an external
style sheet.
/**********************************************************************/
angular.module('style-sheet-factory', [])

.factory('styleSheetFactory', ['$log', function($log) {
    /************************************************************************
    Local Variables
    ************************************************************************/
    // Array of selectors modified by the browser.
    var _modifiedSelectors = [];

    var _insertCSSRule = function(sheet, selector, rules, index) {
        index = index || 1;

        try {
            sheet.insertRule(selector + "{" + rules + "}", index);

            // Parse browser's selector
            var newSelector = sheet.cssRules[index].cssText.split(' {')[0];

            // If browser modified the selector, store it.
            if(selector !== newSelector) {
                var selectorObj = {
                    'old': selector,
                    'new': newSelector
                };

                _modifiedSelectors.push(selectorObj);
            }

            return sheet.cssRules[1].cssText;
        } catch(e) {
            $log.error('Failed to add rule: ' + selector);
        }
    };

    return {
        // Finds and returns the browsers's main style sheet.
        getStyleSheet: function() {
            for(var i=0; i<document.styleSheets.length; i++) {
                if(
                    document.styleSheets[i].media.mediaText === '' ||
                    document.styleSheets[i].media.mediaText === 'all' ||
                    document.styleSheets[i].media.mediaText === 'screen'
                ) {
                    return document.styleSheets[i];
                }
            }

            return null;
        },

        // Gets the prefix related to the user's browser type. Used in
        // CSS for non-standardized properties.
        getPrefix: function() {
            var prefixes = ['Webkit', 'Moz', 'ms', 'O', 'Khtml'];
            var len = prefixes.length;

            for(var i=0; i<len; i++) {
                if(document.body.style[ prefixes[i] + 'AnimationName' ] !== undefined) {
                    return '-'+prefixes[i].toLowerCase()+'-';
                }
            }
            return '';
        },

        // Returns whether a rule of that selector exists in the stylesheet.
        hasCSSRule: function(sheet, selector) {
            var rules = sheet.cssRules;
            var len = _modifiedSelectors.length

            // Check for a modified selector.
            for(var m=0; m<len; m++) {
                if(selector === _modifiedSelectors[m].old) {
                    selector = _modifiedSelectors[m].new;
                }
            }

            len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].selectorText === selector) {
                    return true;
                }
            }

            return false;
        },

        // Returns whether a keyframe of that name exists in the stylesheet.
        hasCSSKeyframes: function(sheet, name) {
            var rules = sheet.cssRules;
            var len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].name === name) {
                    return true;
                }
            }

            return false;
        },

        // If no selector of that rule exists, adds the new rule to the stylesheet.
        addCSSRule: function(sheet, selector, rules, index) {
            if(!this.hasCSSRule(sheet, selector)) {
                return _insertCSSRule(sheet, selector, rules, index);
            }
        },

        // Removes a rule of the given selector from the stylesheet.
        removeCSSRule: function(sheet, selector) {
            var rules = sheet.cssRules;
            var len = _modifiedSelectors.length;

            // Check for a modified selector and remove it.
            for(var m=0; m<len; m++) {
                if(selector === _modifiedSelectors[m].old) {
                    selector = _modifiedSelectors[m].new;

                    _modifiedSelectors.splice(m, 1);
                }
            }

            len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].selectorText === selector) {
                    sheet.deleteRule(i);
                    return true;
                }
            }

            return false;
        },

        // Removes a keyframe of the given name from the stylesheet.
        removeCSSKeyframes: function(sheet, name) {
            var rules = sheet.cssRules;
            var len = rules.length;

            for(var i=0; i<len; i++) {
                if(rules[i].name === name) {
                    sheet.deleteRule(i);
                    return true;
                }
            }

            return false;
        },

        // Adds a keyframes animation to the stylesheet with te appropriate prefixing.
        addCSSKeyframes: function(sheet, name, rules, index) {
            if(!this.hasCSSKeyframes(sheet, name)) {
                return _insertCSSRule(sheet, '@'+this.getPrefix()+'keyframes '+name, rules, index);
            }
        }
    }
}]);




/***********************************************************************
Popup Directive
Author: Brenton Klik
Prerequisites:
 - AngularJS
 - styleSheetFactory (https://github.com/bklik/styleSheetFactory)
Description:
Create a popup positioned under the given element.
/**********************************************************************/
angular.module('popup-directive', ['style-sheet-factory'])

.directive('popup', ['styleSheetFactory', function(styleSheetFactory) {
    return {
        scope: {
            api: '=',
            hideCallback: '&'
        },
        restrict: 'E',
        link: function($scope, $element, $attrs) {
            /************************************************************************
            API
            ************************************************************************/
            $scope.api = {
                show: function(event) {
                    show(event);
                },

                hide: function() {
                    hide();
                },
            };

            /************************************************************************
            Variables
            ************************************************************************/
            // The document's stylesheet.
            var styleSheet = styleSheetFactory.getStyleSheet();

            // The prefix used by the browser for non-standard properties.
            var prefix = styleSheetFactory.getPrefix();

            // Target element the popup should appear next to.
            var target = null;

            // Used to track whether or not a move happened during a touch.
            var touchMove = false;

            // Used by event listeners to prevent the popup from closing.
            var preventClose = function(event) {
                event.stopPropagation();
            }

            /************************************************************************
            Methods
            ************************************************************************/
            // Closes the popup if a touch happens and no touchmove event fired.
            var touchHandler = function(event) {
                if(event.type === "touchmove") {
                    touchMove = true;
                } else if(event.type === 'touchend') {
                    if(!touchMove) {
                        hide();
                    }
                    touchMove = false;
                }
            };

            // Display the popup
            var show = function(event) {
                if(typeof event !== 'undefined') {
                    if(typeof event.target !== 'undefined') {
                        target = event.target;
                    } else {
                        target = event;
                    }

                    $element.addClass('show');
                    position(target);

                    target.addEventListener('mousedown', preventClose);
                    target.addEventListener('keydown', hide);
                    window.addEventListener('mousedown', hide);
                    window.addEventListener('touchmove', touchHandler);
                    window.addEventListener('touchend', touchHandler, false);
                } else {
                    console.error('Popup Directive method "show" requires a target element.');
                }
            };

            // Hide the popup
            var hide = function() {
                if(typeof $scope.hideCallback == 'function') {
                    $scope.hideCallback();
                };

                $element.removeClass('show');
                target.removeEventListener('mousedown', preventClose);
                target.removeEventListener('keydown', hide);
                window.removeEventListener('mousedown', hide);
                window.removeEventListener('touchmove', touchHandler);
                window.removeEventListener('touchend', touchHandler);

                target = null;
                $element.removeClass('adjust-arrow');
                styleSheetFactory.removeCSSRule(styleSheet, 'popup.adjust-arrow::after');
            }

            // Position the popup under the element that triggered the event.
            var position = function(target) {
                var targetRect = target.getBoundingClientRect();
                var popupRect = $element[0].getBoundingClientRect();
                var bodyRect = document.body.getBoundingClientRect();
                var parentRect = target.parentNode.getBoundingClientRect();

                var top = (targetRect.top - parentRect.top) + targetRect.height + 16;
                var left = (targetRect.left - parentRect.left);

                // Make sure the popup isn't off the edge of the page.
                if(targetRect.left + popupRect.width > bodyRect.width) {
                    var adjustment = ((targetRect.left + popupRect.width) - bodyRect.width);
                    left = left - adjustment;

                    styleSheetFactory.addCSSRule(styleSheet, 'popup.adjust-arrow::after',
                        'left: '+(10 + adjustment)+'px;'
                    );
                    $element.addClass('adjust-arrow');
                }

                $element.attr('style',
                    'top: '+top+'px;' +
                    'left: '+left+'px;'
                );
            };

            /************************************************************************
            Init
            ************************************************************************/
            // Prevent close if any touchs/clicks happen inside the popup
            $element.bind('mousedown', preventClose);
            $element[0].addEventListener('touchend', preventClose, true);

            /************************************************************************
            Styles
            ************************************************************************/

            // Add this directive's styles to the document's stylesheet.
            styleSheetFactory.addCSSRule(styleSheet, 'popup',
                'background: white;' +
                'border-radius: 2px;' +
                'box-shadow: 0 1px 4px rgba(0,0,0,0.25);' +
                'display: none;' +
                'min-height: 32px;' +
                'min-width: 32px;' +
                'overflow: visible;' +
                'padding: 8px;' +
                'position: absolute;' +
                'transform: translateZ(0);' +
                prefix+'transform: translateZ(0);' +
                'z-index: 1;'
            );

            styleSheetFactory.addCSSRule(styleSheet, 'popup::after',
                'background-color: white;' +
                'border-left: 1px solid rgba(0,0,0,0.08);' +
                'border-top: 1px solid rgba(0,0,0,0.08);' +
                'box-sizing: border-box;' +
                'content: \'\';' +
                'display: block;' +
                '' +
                'position: absolute;' +
                'top: -6px;' +
                'left: 10px;' +
                'height: 10px;' +
                'width: 10px;' +
                '' +
                prefix+'transform: rotate(45deg);' +
                'transform: rotate(45deg);'
            );

            styleSheetFactory.addCSSRule(styleSheet, 'popup.show',
                'display: inline-block;' +
                '' +
                '-webkit-animation: popup-slidein 250ms;' +
                '-moz-animation: popup-slidein 250ms;' +
                'animation: popup-slidein 250ms;'
            );

            styleSheetFactory.addCSSKeyframes(styleSheet, 'popup-slidein',
                'from {' +
                    'opacity: 0;' +
                    prefix+'transform: translateY(16px);' +
                    'transform: translateY(16px);' +
                '}' +
                'to {' +
                    'opacity: 1;' +
                    prefix+'transform: translateY(0);' +
                    'transform: translateY(0);' +
                '}'
            );
        }
    }
}]);
