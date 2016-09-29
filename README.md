# lg-language-picker

##language-picker
Uses [style-sheet-factory](https://github.com/bklik/style-sheet-factory) and [popup-directive](https://github.com/bklik/popup-directive)

###Use
in header
```html
<head>
	<script src="lg-language-picker/directive.js" ></script>
</head>
```
in module declaration
```javascript
var myApp = angular.module('myApp', ['lgLanguagePicker']);
```
in HTML code
```html
<lg-language-picker choices="fr,en,nl" ng-model="idLangue"></lg-language-picker>
```
