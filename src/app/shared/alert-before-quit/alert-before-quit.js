angular.module('alert-before-quit', [])
	.directive('alertBeforeQuit', function () {
		return {
			restrict: 'A',
			link: function (scope, elem, attrs) {
				window.onbeforeunload = function (event) {
					if (scope.$eval(attrs.alertBeforeQuit) && attrs.alertMessage) {
						var message = attrs.alertMessage;
						if (typeof event === 'undefined') {
							event = window.event;
						}
						if (event) {
							event.returnValue = message;
						}
						return message;
					}
				};
			}
		};
	});
