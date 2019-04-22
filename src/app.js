import Inertia from 'inertia'

export default {
  name: 'Inertia',
  props: {
    initialPage: Object,
    resolveComponent: Function,
    beforeVisit: {
      type: Function,
      default: null
    },
    afterVisit: {
      type: Function,
      default: null
    },
  },
  provide() {
    return {
      page: this.page
    }
  },
  data() {
    return {
      page: {
        instance: null,
        props: null,
      }
    }
  },
  created() {
    Inertia.init(
      this.initialPage,
      (page) => {
        return Promise.resolve(this.resolveComponent(page.component)).then(instance => {
          this.page.instance = instance
          this.page.props = page.props
        })
      },
      this.beforeVisit,
      this.afterVisit
    )
  },
  render(h) {
    if (this.page.instance) {
      return h(this.page.instance, {
        key: window.location.pathname,
        props: this.page.props
      })
    }
  }
}
