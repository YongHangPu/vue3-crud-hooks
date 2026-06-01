import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElTable: defineComponent({
    name: 'ElTable',
    emits: ['selection-change', 'sort-change', 'filter-change'],
    setup(_, { emit, slots }) {
      return () =>
        h('div', { class: 'el-table-stub' }, [
          h('button', {
            class: 'trigger-selection',
            onClick: () => emit('selection-change', [{ id: 1, name: 'Tom' }])
          }),
          slots.default?.(),
          slots.append?.()
        ])
    }
  }),
  ElTableColumn: defineComponent({
    name: 'ElTableColumn',
    props: {
      label: { type: String, default: '' },
      prop: { type: String, default: '' },
      type: { type: String, default: '' }
    },
    setup(props, { slots }) {
      return () =>
        h('div', { class: 'el-table-column-stub', 'data-type': props.type, 'data-prop': props.prop }, [
          props.label ? h('span', { class: 'column-label' }, props.label) : null,
          slots.header?.({ column: {}, $index: 0 }),
          slots.default?.({
            row: { id: 1, name: 'Tom' },
            $index: 0,
            column: {}
          })
        ])
    }
  }),
  ElLink: defineComponent({
    name: 'ElLink',
    emits: ['click'],
    setup(_, { emit, slots, attrs }) {
      return () =>
        h(
          'button',
          {
            class: 'el-link-stub',
            disabled: attrs.disabled as boolean | undefined,
            onClick: () => emit('click')
          },
          slots.default?.()
        )
    }
  }),
  ElButton: defineComponent({
    name: 'ElButton',
    emits: ['click'],
    setup(_, { emit, slots, attrs }) {
      return () =>
        h(
          'button',
          {
            class: 'el-button-stub',
            disabled: attrs.disabled as boolean | undefined,
            onClick: () => emit('click')
          },
          slots.default?.()
        )
    }
  }),
  ElPagination: defineComponent({
    name: 'ElPagination',
    props: {
      currentPage: { type: Number, default: 1 },
      pageSize: { type: Number, default: 10 },
      total: { type: Number, default: 0 }
    },
    emits: ['update:currentPage', 'update:pageSize', 'current-change', 'size-change'],
    setup(_, { emit }) {
      return () =>
        h('div', { class: 'el-pagination-stub' }, [
          h('button', {
            class: 'trigger-page',
            onClick: () => {
              emit('update:currentPage', 2)
              emit('current-change', 2)
            }
          })
        ])
    }
  })
}))

import CustomTable from '@/components/CustomTable.vue'

describe('CustomTable.vue', () => {
  it('选择变化时向外抛出 selection-change 事件', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          selection: true,
          columns: [{ prop: 'name', label: '名称' }]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await wrapper.find('.trigger-selection').trigger('click')

    expect(wrapper.emitted('selection-change')).toEqual([[[{ id: 1, name: 'Tom' }]]])
  })

  it('操作列按钮点击时抛出 action 事件', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            {
              prop: 'action',
              label: '操作',
              type: 'action',
              buttons: [{ event: 'edit', btnText: '编辑' }]
            }
          ]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await wrapper.find('.el-link-stub').trigger('click')

    expect(wrapper.emitted('action')).toEqual([['edit', { id: 1, name: 'Tom' }, 0]])
  })

  it('分页存在时可继续向外抛出 pagination 事件', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [{ prop: 'name', label: '名称' }],
          pagination: {
            total: 20,
            currentPage: 1,
            pageSize: 10
          }
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: {
        directives: {
          loading: {}
        }
      }
    })

    await wrapper.find('.trigger-page').trigger('click')

    expect(wrapper.emitted('pagination')).toEqual([[{ page: 2, limit: 10 }]])
    expect(wrapper.emitted('current-change')).toEqual([[2]])
    expect(wrapper.emitted('size-change')).toEqual([[10]])
  })
})
