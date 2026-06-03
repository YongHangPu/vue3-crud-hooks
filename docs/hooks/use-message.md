# useMessage

消息提示解耦 Hook，将 Element Plus 的 `ElMessage` / `ElMessageBox` 封装为统一接口。支持通过 `messageApi` 替换为任意 UI 库。

## 为什么需要 useMessage

在 `useTablePage` 和 `useFormDialog` 内部，操作反馈（成功/错误/警告/确认弹窗）都通过 `useMessage` 调用。默认使用 Element Plus，但你可以通过 `messageApi` 配置替换为其他 UI 库：

```typescript
useTablePage(fetchList, {}, {
  messageApi: {
    success: (msg) => myUI.showSuccess(msg),
    error: (msg) => myUI.showError(msg),
    confirm: (msg) => myUI.showConfirm(msg),
  }
})
```

## API

```typescript
const message = useMessage(customMessageApi?: Partial<MessageApi>)
```

### 返回值

| 方法 | 签名 | 说明 |
|------|------|------|
| `success` | `(msg: string) => void` | 成功提示 |
| `error` | `(msg: string) => void` | 错误提示 |
| `warning` | `(msg: string) => void` | 警告提示 |
| `confirm` | `(msg: string, title?, options?) => Promise` | 确认弹窗，确认时 resolve，取消时 reject |

### MessageApi 接口

```typescript
interface MessageApi {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  confirm: (msg: string, title?: string, options?: any) => Promise<any>
}
```

只需实现需要的部分，未实现的方法会回退到 Element Plus 默认实现。

## 自定义消息适配示例

```typescript
import { useMessage } from 'vue3-crud-hooks'

// 替换为 Ant Design Vue 的消息提示
const message = useMessage({
  success: (msg) => messageApi.success(msg),
  error: (msg) => messageApi.error(msg),
  confirm: (msg) => modal.confirm({ title: '提示', content: msg }),
})
```
