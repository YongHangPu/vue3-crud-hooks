import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

export const mountComposable = <T>(factory: () => T) => {
  let result!: T

  mount(
    defineComponent({
      setup() {
        result = factory()
        return () => null
      }
    })
  )

  return result
}
