angular.module('blog', ['ngRoute','ngAnimate'])

.factory('Articles', function($http) {
  var factory = {};
  factory.getArticles = function(){
    return $http.get('/api/articles');
  };
  factory.getArticle = function(id) {
    return $http.get('/api/articles/'+id);
  };
  factory.saveArticle = function(article) {
    return $http.post('/api/articles', {
      title:article.title,
      content:article.content,
      summary:article.content,
      published:dateNow()
    });
  };
  factory.deleteArticle = function(id) {
    return $http.delete('/api/articles/'+id);
  };

  return factory;
})

.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller:'ListCtrl',
      templateUrl:'list.html'
    })
    .when('/post', {
      controller: 'NewPostCtrl',
      templateUrl: 'edit.html'
    })
    .when('/post/:post_id', {
      controller:'EditPostCtrl',
      templateUrl:'edit.html'
    })
    .otherwise({
      redirectTo:'/'
    });
})

.controller('ListCtrl', function($scope, Articles) {
  Articles.getArticles().success(function(data) {
    $scope.articles = data;
  });
})

.controller('NewPostCtrl', function($scope, $routeParams, $location, Articles) {
  $scope.article={};
  
  $scope.save = function() {
    Articles.saveArticle($scope.article);
    $location.path('#/');
  };

})

.controller('EditPostCtrl', function($scope, $routeParams, $location, Articles) {
 
  $scope.article = {};

  Articles.getArticle($routeParams.post_id).success(function(data) {
    $scope.article=data[0];
  });
  $scope.save = function() {
    Articles.saveArticle($scope.article);
    $location.path('#/');
  };

  $scope.delete = function() {
    Articles.deleteArticle($scope.article._id);
    $location.path('#/');
  };
});

function dateNow() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!

  var yyyy = today.getFullYear();
  if(dd<10){dd='0'+dd;} if(mm<10){mm='0'+mm;} today = mm+'/'+dd+'/'+yyyy;
}
