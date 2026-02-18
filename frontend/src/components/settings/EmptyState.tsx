import { Package } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        还没有配置任何模型提供商
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        点击右上角「添加配置」按钮开始添加您的第一个模型提供商配置
      </p>
    </div>
  )
}
