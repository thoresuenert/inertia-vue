# Inertia.js Vue Adapter

> **Note:** This project is in the very early stages of development and IS NOT yet intended for public consumption. If you submit an issue, I do not guarantee a response. Please do not submit pull requests without first consulting me on Twitter ([@reinink](https://twitter.com/reinink)).

## Installation

Install using NPM:

~~~sh
npm install inertiajs/inertia-vue --save
~~~

## Create root template

The first step when using Inertia.js is to create a root template. This template should include your assets, as well as a single `div` with a `data-page` attribute. This `div` is the root element that we'll use to boot Vue.js in, and the `data-page` attribute will the inital page information. Here's a PHP example:

~~~php
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link href="{{ mix('/css/app.css') }}" rel="stylesheet">
    <script src="{{ mix('/js/app.js') }}" defer></script>
</head>
<body>

<div id="app" data-page="{{ json_encode($page) }}"></div>

</body>
</html>
~~~

The `$page` object should contain three values:

- `component`: The name of the Vue page component.
- `props`: The page component data (props).
- `version`: The current asset version (if you want to use automatic asset refreshing).

## Setting up Webpack

Here is an example Webpack configuration that uses [Laravel Mix](https://github.com/JeffreyWay/laravel-mix). Note the `@` alias to the `/resources/js` directory.

~~~js
const mix = require('laravel-mix')
const path = require('path')

mix.js('resources/js/app.js', 'public/js').webpackConfig({
  output: { chunkFilename: 'js/[name].[contenthash].js' },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.runtime.js',
      '@': path.resolve('resources/js'),
    },
  },
})
~~~

## Setup dynamic imports

We recommend using code splitting with Inertia.js. To do this we need to enable [dynamic imports](https://github.com/tc39/proposal-dynamic-import). We'll use a Babel plugin to make this work. First, install the plugin:

~~~sh
npm install @babel/plugin-syntax-dynamic-import --save
~~~

Next, create a `.babelrc` file in your project with the following:

~~~js
{
  "plugins": ["@babel/plugin-syntax-dynamic-import"]
}
~~~

## Initializing Vue

Next, update your main JavaScript file to boot your Inertia app. All we're doing here is initializing Vue with the base Inertia page component.

~~~js
import Inertia from 'inertia-vue'
import Vue from 'vue'

let app = document.getElementById('app')

new Vue({
  render: h => h(Inertia, {
    props: {
      initialPage: JSON.parse(app.dataset.page),
      resolveComponent: (component) => {
        return import(`@/Pages/${component}`).then(module => module.default)
      },
      beforeVisit: () => { /* start loading indicator */ },
      afterVisit: () => { /* stop loading indicator */ },
    },
  }),
}).$mount(app)
~~~

The `resolveComponent` is a callback that tells Inertia how to load a page component. This callback must return a promise with a page instance.

The `beforeVisit` and `afterVisit` is an optional callback to overwrite the usage of [nprogress](http://ricostacruz.com/nprogress/) as a loading indicator. 

## Creating a base layout

While not required, for most projects it makes sense to create a default site layout that your specific pages can extend. Save this to `/Shared/Layout.vue`.

~~~html
<template>
  <main>
    <header>
      <inertia-link href="/">Home</inertia-link>
      <inertia-link href="/about">About</inertia-link>
      <inertia-link href="/contact">Contact</inertia-link>
    </header>
    <article>
      <slot />
    </article>
  </main>
</template>

<script>
import { InertiaLink } from 'inertia-vue'

export default {
  components: {
    InertiaLink,
  },
}
</script>
~~~

## Creating page components

With Inertia.js, each page in your application is a JavaScript component. Here's an example of a page component. Save this to `/Pages/Welcome.vue`. Note how it extends the `Layout.vue` component we created above.

~~~html
<template>
  <layout>
    <h1>Welcome</h1>
    <p>Welcome to my first Inertia.js app!</p>
  </layout>
</template>

<script>
import Layout from '@/Shared/Layout'

export default {
  components: {
    Layout,
  },
}
</script>
~~~

## Creating links

To create an Inertia link, use the `<inertia-link>` component.

~~~html
<template>
  <inertia-link href="/">Home</inertia-link>
</template>

<script>
import { InertiaLink } from 'inertia-vue'
export default {
  components: { InertiaLink }
}
</script>
~~~

You can also specify the browser history and scroll behaviour. By default all link clicks "push" a new history state, and reset the scroll position back to the top of the page. However, you can override these defaults using the `replace` and `preserve-scroll` attributes.

~~~html
<inertia-link href="/" replace preserve-scroll>Home</inertia-link>
~~~

You can also specify the method for the request. The default is `GET`, but you can also use `POST`, `PUT`, `PATCH`, and `DELETE`.

~~~html
<inertia-link href="/logout" method="post">Logout</inertia-link>
~~~

## Manually making visits

In addition to clicking links, it's also very common to manually make Inertia visits. The following methods are available:

~~~js
// Make a visit
Inertia.visit(url, { method = 'get', data = {}, replace = false, preserveScroll = false })

// Make a "replace" visit
Inertia.replace(url, { method = 'get', data = {}, preserveScroll = false })

// Make a "replace" visit to the current url
Inertia.reload({ method = 'get', data = {}, preserveScroll = false })

// Make a POST visit
Inertia.post(url, data = {}, { replace = false, preserveScroll = false })

// Make a PUT visit
Inertia.put(url, data = {}, { replace = false, preserveScroll = false })

// Make a PATCH visit
Inertia.patch(url, data = {}, { replace = false, preserveScroll = false })

// Make a DELETE visit
Inertia.delete(url, { replace = false, preserveScroll = false })
~~~

Just like with an `<inertia-link>`, you can set the browser history and scroll behaviour using the `replace` and `preserveScroll` options.

## Accessing page data in other components

Sometimes it's necessary to access the page data (props) from a non-page component. One really common use-case for this is the site layout. For example, maybe you want to show the currently authenticated user in your site header. This is possible using Vue's provide/inject features. The base Inertia component automatically "provides" the current page object, which can then be "injected" into any component. Here's a simple example:

~~~vue
<template>
  <main>
    <header>
      You are logged in as: {{ page.props.auth.user.name }}
      <nav>
        <inertia-link href="/">Home</inertia-link>
        <inertia-link href="/about">About</inertia-link>
        <inertia-link href="/contact">Contact</inertia-link>
      </nav>
    </header>
    <article>
      <slot />
    </article>
  </main>
</template>

<script>
import { InertiaLink } from 'inertia-vue'

export default {
  components: {
    InertiaLink,
  },
  inject: ['page'],
}
</script>
~~~
