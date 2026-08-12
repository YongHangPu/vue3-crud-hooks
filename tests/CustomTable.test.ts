import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElTable: defineComponent({
    name: 'ElTable',
    emits: ['selection-change', 'sort-change', 'filter-change'],
    setup(_, { emit, slots, attrs }) {
      return () =>
        h('div', { class: 'el-table-stub', 'data-height': (attrs.height as string) ?? '' }, [
          h('button', {
            class: 'trigger-selection',
            onClick: () => emit('selection-change', [{ id: 1, name: 'Tom' }])
          }),
          h('button', {
            class: 'trigger-sort',
            onClick: () => emit('sort-change', { prop: 'name', order: 'ascending' })
          }),
          h('button', {
            class: 'trigger-filter',
            onClick: () => emit('filter-change', { name: ['active'] })
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
            ...attrs,
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
            ...attrs,
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

    expect(wrapper.emitted('pagination')).toEqual([[{ currentPage: 2, pageSize: 10 }]])
    expect(wrapper.emitted('current-change')).toEqual([[2]])
    expect(wrapper.emitted('size-change')).toEqual([[10]])
  })

  it('autoHeight 启用时自动计算并注入高度到 el-table', async () => {
    // jsdom 无 ResizeObserver,useTableHeight 降级为仅 resize 监听
    window.innerHeight = 900
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [{ prop: 'name', label: '名称' }],
          pagination: true,
        },
        data: [{ id: 1, name: 'Tom' }],
        autoHeight: true,
      },
    })
    await flushPromises()
    await flushPromises()

    const height = Number(wrapper.find('.el-table-stub').attributes('data-height'))
    // jsdom 中 getBoundingClientRect 全为 0:900(视口) - 0(偏移) - 0(分页器) - 40(extraGap) - 0(padding) = 860
    expect(height).toBe(860)
  })

  it('autoHeight 默认开启:不传该属性时自动注入计算高度', async () => {
    window.innerHeight = 900
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name', label: '名称' }] },
        data: [{ id: 1, name: 'Tom' }],
      },
      global: { directives: { loading: {} } }
    })
    await flushPromises()
    await flushPromises()

    // jsdom 中 getBoundingClientRect 全为 0:900 - 0 - 0 - 40 = 860(默认 extraGap 40)
    expect(Number(wrapper.find('.el-table-stub').attributes('data-height'))).toBe(860)
  })

  it('autoHeight 为 false 时不注入 height', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name', label: '名称' }] },
        data: [{ id: 1, name: 'Tom' }],
        autoHeight: false,
      },
      global: { directives: { loading: {} } }
    })
    expect(wrapper.find('.el-table-stub').attributes('data-height')).toBe('')
  })

  it('sort-change 事件透传给父组件', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name', label: '名称', sortable: 'custom' }] },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    await wrapper.find('.trigger-sort').trigger('click')

    expect(wrapper.emitted('sort-change')).toEqual([[{ prop: 'name', order: 'ascending' }]])
  })

  it('filter-change 事件透传给父组件', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name', label: '名称', filters: [{ text: '启用', value: 'active' }] }] },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    await wrapper.find('.trigger-filter').trigger('click')

    expect(wrapper.emitted('filter-change')).toEqual([[{ name: ['active'] }]])
  })

  it('action 列按钮 visible 函数控制显隐(v-show)', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            {
              prop: 'action',
              label: '操作',
              type: 'action',
              buttons: [
                { event: 'edit', btnText: '编辑', visible: () => false },
                { event: 'delete', btnText: '删除', visible: () => true }
              ]
            }
          ]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    const links = wrapper.findAll('.el-link-stub')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('style') || '').toContain('display: none')
    expect(links[1].attributes('style') || '').not.toContain('display: none')
  })

  it('action 列按钮 disabled 函数控制禁用状态', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            {
              prop: 'action',
              label: '操作',
              type: 'action',
              buttons: [
                { event: 'edit', btnText: '编辑', disabled: (row: any) => row.id === 1 },
                { event: 'delete', btnText: '删除', disabled: (row: any) => row.id !== 1 }
              ]
            }
          ]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    const links = wrapper.findAll('.el-link-stub')
    expect(links).toHaveLength(2)
    expect(links[0].attributes('disabled')).toBeDefined()
    expect(links[1].attributes('disabled')).toBeUndefined()
  })

  it('action 列 btnType 为 button 时渲染 el-button 并可点击', async () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            {
              prop: 'action',
              label: '操作',
              type: 'action',
              buttons: [{ event: 'edit', btnText: '编辑', btnType: 'button' }]
            }
          ]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    expect(wrapper.find('.el-button-stub').exists()).toBe(true)
    await wrapper.find('.el-button-stub').trigger('click')
    expect(wrapper.emitted('action')).toEqual([['edit', { id: 1, name: 'Tom' }, 0]])
  })

  it('自定义插槽列渲染内容插槽与表头插槽', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            { prop: 'name', label: '名称' },
            { prop: 'status', label: '状态', slotName: 'status' }
          ]
        },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } },
      slots: {
        status: (props: any) => h('span', { class: 'status-cell' }, `${props.row.name}-custom`),
        'status-header': () => h('span', { class: 'status-header' }, '自定义表头')
      }
    })

    expect(wrapper.find('.status-cell').exists()).toBe(true)
    expect(wrapper.find('.status-cell').text()).toBe('Tom-custom')
    expect(wrapper.find('.status-header').exists()).toBe(true)
  })

  it('hidden 列不渲染', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: {
          columns: [
            { prop: 'name', label: '名称' },
            { prop: 'secret', label: '隐藏列', hidden: true }
          ]
        },
        data: [{ id: 1, name: 'Tom', secret: 'x' }]
      },
      global: { directives: { loading: {} } }
    })

    const columns = wrapper.findAll('.el-table-column-stub')
    expect(columns).toHaveLength(1)
    expect(columns[0].attributes('data-prop')).toBe('name')
  })

  it('pagination 为 false 时不显示分页器', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name' }], pagination: false },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    expect(wrapper.find('.pagination-container').exists()).toBe(false)
  })

  it('未配置分页时不显示分页器', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name' }] },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    expect(wrapper.find('.pagination-container').exists()).toBe(false)
  })

  it('有数据时显示分页器', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name' }], pagination: true },
        data: [{ id: 1, name: 'Tom' }]
      },
      global: { directives: { loading: {} } }
    })

    expect(wrapper.find('.pagination-container').exists()).toBe(true)
  })

  it('无数据但 total 大于 0 时显示分页器', () => {
    const wrapper = mount(CustomTable, {
      props: {
        config: { columns: [{ prop: 'name' }], pagination: { total: 100, currentPage: 1, pageSize: 10 } },
        data: []
      },
      global: { directives: { loading: {} } }
    })

    expect(wrapper.find('.pagination-container').exists()).toBe(true)
  })
})
