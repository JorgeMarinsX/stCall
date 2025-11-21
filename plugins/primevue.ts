/* Below there's an example on how to handlee imports to primevue. 
All the items imported below are already globally available 
due to the usage of @primevue/nuxt-module in nuxt.config.ts. 
This file can be used if you want to customize the PrimeVue setup.
Use it to register only specific components for production */

/*import PrimeVue from 'primevue/config'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import SplitButton from 'primevue/splitbutton'
import InputText from 'primevue/inputtext'
import Sidebar from 'primevue/sidebar'
import Panel from 'primevue/panel'
import Card from 'primevue/card'

export default defineNuxtPlugin((nuxtApp) => {
  const app = nuxtApp.vueApp

  app.use(PrimeVue, {
    ripple: true,
    inputStyle: 'filled'
  })

  app.component('Avatar', Avatar)
  app.component('Button', Button)
  app.component('Toolbar', Toolbar)
  app.component('SplitButton', SplitButton)
  app.component('InputText', InputText)
  app.component('Sidebar', Sidebar)
  app.component('Panel', Panel)
  app.component('Card', Card)
})
*/

