import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  scrollToSpy: vi.fn()
}))

vi.mock('@/utils/scroll-to', () => ({
  scrollTo: mocks.scrollToSpy
}))

vi.mock('element-plus', () => ({
  ElPagination: defineComponent({
    name: 'ElPagination',
    props: {
      currentPage: { type: Number, default: 1 },
      pageSize: { type: Number, default: 10 },
      total: { type: Number, default: 0 }
    },
    emits: ['update:currentPage', 'update:pageSize', 'current-change', 'size-change'],
    setup(props, { emit }) {
      return () =>
        h('div', { class: 'el-pagination-stub' }, [
          h('button', {
            class: 'trigger-page',
            onClick: () => {
              emit('update:currentPage', 2)
              emit('current-change', 2)
            }
          }),
          h('button', {
            class: 'trigger-size',
            onClick: () => {
              emit('update:pageSize', 50)
              emit('size-change', 50)
            }
          }),
          h('span', { class: 'state' }, `${props.currentPage}-${props.pageSize}-${props.total}`)
        ])
    }
  })
}))

import Pagination from '@/components/Pagination.vue'

describe('Pagination.vue', () => {
  it('翻页时触发 pagination 和 update:page 事件', async () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        currentPage: 1,
        pageSize: 10
      }
    })

    await wrapper.find('.trigger-page').trigger('click')

    expect(wrapper.emitted('update:currentPage')).toEqual([[2]])
    expect(wrapper.emitted('pagination')).toEqual([[{ currentPage: 2, pageSize: 10 }]])
  })

  it('修改每页条数时触发分页事件并支持自动滚动', async () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 100,
        currentPage: 1,
        pageSize: 10,
        autoScroll: true
      }
    })

    await wrapper.find('.trigger-size').trigger('click')

    expect(wrapper.emitted('update:pageSize')).toEqual([[50]])
    expect(wrapper.emitted('pagination')).toEqual([[{ currentPage: 1, pageSize: 50 }]])
    expect(mocks.scrollToSpy).toHaveBeenCalledWith(0, 800)
  })

  it('修改每页条数导致超出总页数时,分页事件携带重置后的第 1 页', async () => {
    const wrapper = mount(Pagination, {
      props: {
        total: 50,
        currentPage: 5,
        pageSize: 10
      }
    })

    // 第 5 页、每页 10 条,total=50,切到每页 50 条后只剩 1 页,应重置到第 1 页
    await wrapper.find('.trigger-size').trigger('click')

    expect(wrapper.emitted('pagination')).toEqual([[{ currentPage: 1, pageSize: 50 }]])
  })

  it('hidden 为 true 时带有隐藏 class', () => {
    const wrapper = mount(Pagination, {
      props: {
        hidden: true
      }
    })

    expect(wrapper.classes()).toContain('hidden')
  })
})
