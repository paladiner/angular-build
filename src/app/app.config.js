/*
 * Application configuration constants
 */
(function() {
	var wsURL, apiURL;
	if (process.env.NODE_ENV === 'production') {
		wsURL = 'https://api.yourapp.cc:8888';
		apiURL = 'https://api.yourapp.cc/';
	} else if (process.env.NODE_ENV === 'staging') {
		wsURL = 'https://staging-api.yourapp.cc:8888';
		apiURL = 'https://staging-api.yourapp.cc/';
	} else {
		wsURL = 'http://api.messages.yourapp.lo.com/:8888';
		apiURL = 'http://api.messages.yourapp.lo.com/';
	}
	angular.module('YourApp')
		.constant('appConfig', {
			wsURL: wsURL,
			apiURL: apiURL,
			appName: 'YourApp'
		})
		.config(function($locationProvider, $compileProvider, $httpProvider, $animateProvider) {
			// enable html5 urls
			$locationProvider.html5Mode({ requireBase: false, enabled: true });
			// disable debug information in production mode
			$compileProvider.debugInfoEnabled(process.env.NODE_ENV !== 'production');
			// send credentials to API (external domain)
			$httpProvider.defaults.withCredentials = true;
			// optimize $digest count after multiple requests
			$httpProvider.useApplyAsync(true);
		});
}());
