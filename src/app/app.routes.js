// app config
angular.module('YourApp').config(function($httpProvider, $stateProvider, $urlRouterProvider) {
	// handle 503 error -> show maintenance page
	// add special states to handle initial API call and main layout
	(function() {
		function addAbstractState(stateName, rejectIfNotLoggedIn, noHeader) {
			var routeConfigObject = {
				abstract: true,
				views: {
					header: {
						template: 'Header'
					},
					content: {
						template: '<ui-view></ui-view>'
					},
					footer: {
						template: 'footer'
					}
				},
				resolve: {
					userState: /*@ngInject*/ function() {
						return {
							isSuper: true,
							isActive: true
						};
					}
				}
			};
			if (noHeader) {
				delete routeConfigObject.views.header;
			}
			$stateProvider.state(stateName, routeConfigObject);
		}

		addAbstractState('authorizedOnly', true);
		addAbstractState('authorizedOnlyNoHeader', true, true);
		addAbstractState('anonymousAccess', true);
		addAbstractState('anonymousAccessNoHeader', false, true);
		addAbstractState('anonymousAccessMarkup', false, true, true);
	}());

	// declare states
	$stateProvider
		.state('404', {
			parent: 'anonymousAccessNoHeader',
			templateUrl: 'components/404/404.html'
		})
		.state('maintenance', {
			parent: 'anonymousAccessNoHeader',
			templateUrl: 'components/maintenance/maintenance.html'
		})
		// .state('project', {
		// 	abstract: true,
		// 	parent: 'authorizedOnly',
		// 	params: {
		// 		projectHash: null
		// 	},
		// 	views: {
		// 		'': {
		// 			template: '<div ui-view></div>'
		// 		}
		// 	},
		// 	resolve: {
		// 		client: function($q, Client) {
		// 			return $q.when(Client).then(function(data) {
		// 				return data;
		// 			});
		// 		}
		// 	}
		// })
		.state('home', {
			url: '/',
			parent: 'authorizedOnly',
			templateUrl: 'components/home/home.html',
			controller: 'HomeController',
			controllerAs: 'home',
			resolve: {
				// ProjectService: 'ProjectService',
				// projectList: function(ProjectService, userState, $q) {
				// 	if (userState.isGuest() || userState.isFakeUser()) {
				// 		userState.resetUserData();
				// 		return $q.reject(new Error('NotLoggedIn'));
				// 	}

				// 	return ProjectService.getList().then(function(data) {
				// 		return data;
				// 	}, function() {
				// 		return [];
				// 	});
				// }
			}
		});
	// redirect to root when no matching routes found
	$urlRouterProvider.otherwise(function($injector, $location) {
		$injector.get('$state').go('404');
		return $location.url();
	});
});

// additional routing handlers
angular.module('YourApp').run(function(appConfig,$http, $rootScope) {
	// handle login state
	$rootScope.$on('$stateChangeError', function(e, toState, toParams, fromState, fromParams, error) {
		throw error;
	});
});

// manually bootstrap angular app
angular.element(document).ready(function() {
	// update body contents
	document.body.removeChild(document.querySelector('noscript'));
	// create the root <ui-view>
	document.body.appendChild(document.createElement('div')).setAttribute('ui-view', 'header');
	document.body.appendChild(document.createElement('div')).setAttribute('ui-view', 'content');
	document.body.appendChild(document.createElement('div')).setAttribute('ui-view', 'footer');
	// initialize angular
	angular.bootstrap(document, ['YourApp']);
});
