import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../app/store'
import {
  Button,
  Card,
  Chip,
  Icon,
  InfoNote,
  Kbd,
  Modal,
  PageHeader,
  SectionTitle,
  useToast,
} from '../components/ui'
import { clearActiveSession, downloadExport, parseImport, STORAGE_KEY } from '../services/storage'
import { CONTENT_STATS } from '../content'
import type { PersistedState, ThemePreference } from '../types'
import { cn } from '../utils'

const themes: { value: ThemePreference; label: string; description: string; icon: 'sun' | 'moon' | 'monitor' }[] = [
  { value: 'light', label: 'Светлая', description: 'Тёплая бумага', icon: 'sun' },
  { value: 'dark', label: 'Тёмная', description: 'Графит', icon: 'moon' },
  { value: 'system', label: 'Системная', description: 'Как на устройстве', icon: 'monitor' },
]

type ConfirmAction = 'progress' | 'all' | 'import' | null

export function SettingsPage() {
  const { state, settings, updateSettings, replaceState, resetProgress, resetAll } = useStore()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<ConfirmAction>(null)
  const [imported, setImported] = useState<PersistedState | null>(null)
  const [confirmText, setConfirmText] = useState('')

  const size = new Blob([JSON.stringify(state)]).size
  const sizeLabel = size > 1024 ? `${(size / 1024).toFixed(0)} КБ` : `${size} Б`

  const onExport = () => {
    downloadExport(state)
    toast('Резервная копия скачана.', 'success')
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    const parsed = parseImport(text)
    if (!parsed.ok) {
      toast(parsed.error, 'danger')
      return
    }
    setImported(parsed.state)
    setConfirm('import')
  }

  const closeConfirm = () => {
    setConfirm(null)
    setImported(null)
    setConfirmText('')
  }

  const onConfirm = () => {
    if (confirm === 'progress') {
      clearActiveSession()
      resetProgress()
      toast('Прогресс и статистика сброшены.', 'success')
    }
    if (confirm === 'all') {
      clearActiveSession()
      resetAll()
      toast('Все данные удалены.', 'success')
    }
    if (confirm === 'import' && imported) {
      clearActiveSession()
      replaceState(imported)
      toast('Данные импортированы.', 'success')
    }
    closeConfirm()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Настройки"
        title="Внешний вид и данные"
        description="Тема, резервные копии и критерии, по которым GeoMaster считает материал освоенным."
      />

      <Card>
        <SectionTitle hint="применяется сразу">Тема оформления</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          {themes.map((theme) => {
            const active = settings.theme === theme.value
            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => updateSettings({ theme: theme.value })}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  active ? 'border-accent/45 bg-accent-soft/50 ring-1 ring-accent/20' : 'border-line bg-surface hover:bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    active ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink-3',
                  )}
                >
                  <Icon name={theme.icon} size={17} />
                </span>
                <span>
                  <span className="block text-sm font-medium">{theme.label}</span>
                  <span className="text-[0.6875rem] text-ink-3">{theme.description}</span>
                </span>
                {active && <Icon name="check" size={16} className="ml-auto text-accent" />}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-ink-3">
          По умолчанию используется тема системы. Выбор сохраняется в браузере и не сбрасывается при обновлении страницы.
        </p>
      </Card>

      <Card>
        <SectionTitle hint={`${sizeLabel} в LocalStorage`}>Данные и резервные копии</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="secondary" onClick={onExport} iconLeft={<Icon name="download" size={16} />}>
            Экспорт JSON
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} iconLeft={<Icon name="upload" size={16} />}>
            Импорт JSON
          </Button>
          <Button variant="dangerSoft" onClick={() => setConfirm('progress')} iconLeft={<Icon name="refresh" size={16} />}>
            Сбросить прогресс
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              void onFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
        </div>
        <div className="mt-4 grid gap-2 text-xs text-ink-3 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Chip tone="outline" size="sm">
              {Object.keys(state.progress).length}
            </Chip>
            материалов с прогрессом
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="outline" size="sm">
              {state.sessions.length}
            </Chip>
            занятий в истории
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="outline" size="sm">
              {CONTENT_STATS.items}
            </Chip>
            элементов контента
          </div>
          <div className="flex items-center gap-2">
            <Chip tone="outline" size="sm">
              {state.routes && Object.keys(state.routes).length}
            </Chip>
            маршрутов начато
          </div>
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => setConfirm('all')} iconLeft={<Icon name="trash" size={15} />}>
            Удалить все данные
          </Button>
          <span className="ml-2 text-[0.6875rem] text-ink-3">включая настройки и тему</span>
        </div>
        <InfoNote tone="warn" title="Только этот браузер" icon="lock">
          Прогресс не синхронизируется между устройствами. Для переноса используйте экспорт и импорт JSON. Полный сброс
          нельзя отменить.
        </InfoNote>
      </Card>

      <Card>
        <SectionTitle hint="прозрачная методика">Как считается прогресс</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Просмотрено',
              text: 'Вы открыли карточку в изучении или справочнике. Это ещё не знание.',
              icon: 'eye' as const,
            },
            {
              title: 'Изучено',
              text: 'Было успешное воспроизведение без подсказки или явная отметка «изучено».',
              icon: 'book' as const,
            },
            {
              title: 'Освоено',
              text: 'Уровень 5+, два воспроизведения подряд, два верных применения, интервал от 14 дней, нет нерешённых ошибок.',
              icon: 'graduation' as const,
            },
          ].map((step) => (
            <div key={step.title} className="rounded-xl border border-line bg-surface-2/40 p-3.5">
              <Icon name={step.icon} size={18} className="text-accent" />
              <div className="mt-2 text-sm font-semibold">{step.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-3">{step.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-3.5 text-xs leading-relaxed text-ink-2">
            <div className="mb-1 font-medium text-ink">Интервалы повторения</div>
            Первое возвращение — в рамках занятия, затем 1, 3, 7, 14, 30 и 60 дней. Ошибка сокращает интервал и
            возвращает материал на более раннюю ступень.
          </div>
          <div className="rounded-xl border border-line p-3.5 text-xs leading-relaxed text-ink-2">
            <div className="mb-1 font-medium text-ink">Воспроизведение и понимание</div>
            Это два отдельных показателя. Карточки и свободный ответ тренируют воспроизведение, тесты — понимание и
            различение. Тест не заменяет умение сформулировать.
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle hint="быстрее с клавиатуры">Горячие клавиши</SectionTitle>
        <div className="grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <span>Перевернуть карточку</span>
            <Kbd>Пробел</Kbd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <span>Оценить карточку</span>
            <span className="flex gap-1">
              <Kbd>1</Kbd>
              <Kbd>2</Kbd>
              <Kbd>3</Kbd>
              <Kbd>4</Kbd>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <span>Выбрать вариант</span>
            <span className="flex gap-1">
              <Kbd>1</Kbd>–<Kbd>4</Kbd>
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2">
            <span>Проверить / далее</span>
            <Kbd>Enter</Kbd>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>О GeoMaster</SectionTitle>
        <div className="flex flex-col gap-3 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium text-ink">GeoMaster · геометрия 7–8</div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink-3">
              Учебник-тренажёр без регистрации и сервера. {CONTENT_STATS.topics} тем, {CONTENT_STATS.items} элементов,
              авторские задания и числовые задачи. Материалы ориентированы на базовую школьную программу; расширения
              помечены.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to="/reference"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-ink-2 hover:bg-surface-2"
            >
              <Icon name="book" size={14} /> Справочник
            </Link>
            <a
              href="https://github.com/and7ey/geometry"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs text-ink-2 hover:bg-surface-2"
            >
              <Icon name="external" size={14} /> GitHub
            </a>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[0.6875rem] text-ink-3">
          <Chip tone="outline" size="sm">
            данные не покидают браузер
          </Chip>
          <Chip tone="outline" size="sm">
            ключ {STORAGE_KEY}
          </Chip>
          <Chip tone="outline" size="sm">
            версия 1.0
          </Chip>
        </div>
      </Card>

      <Modal
        open={confirm !== null}
        onClose={closeConfirm}
        title={
          confirm === 'all'
            ? 'Удалить все данные?'
            : confirm === 'progress'
              ? 'Сбросить прогресс?'
              : 'Импортировать данные?'
        }
        description={
          confirm === 'all'
            ? 'Будут удалены настройки, прогресс, статистика, избранное и маршруты. Действие необратимо.'
            : confirm === 'progress'
              ? 'Прогресс, расписание повторений, статистика и избранное будут удалены. Настройки и тема сохранятся.'
              : 'Текущий прогресс будет заменён данными из файла. Рекомендуем сначала сделать экспорт.'
        }
        footer={
          <>
            <Button variant="secondary" onClick={closeConfirm}>
              Отмена
            </Button>
            <Button
              variant={confirm === 'import' ? 'primary' : 'danger'}
              onClick={onConfirm}
              disabled={confirm === 'all' && confirmText !== 'УДАЛИТЬ'}
            >
              {confirm === 'import' ? 'Импортировать' : 'Подтвердить'}
            </Button>
          </>
        }
      >
        {confirm === 'all' && (
          <label className="block text-sm text-ink-2">
            Введите <span className="font-semibold text-ink">УДАЛИТЬ</span>, чтобы подтвердить:
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-line bg-surface-2/60 px-3 text-sm focus:border-danger/40 focus:outline-none"
              placeholder="УДАЛИТЬ"
            />
          </label>
        )}
        {confirm === 'import' && imported && (
          <div className="space-y-2 text-sm text-ink-2">
            <div className="flex justify-between gap-3">
              <span className="text-ink-3">Материалов с прогрессом</span>
              <span>{Object.keys(imported.progress).length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-3">Занятий в истории</span>
              <span>{imported.sessions.length}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-3">Настройки</span>
              <span>
                {imported.settings.grades.join(', ')} класс · {imported.settings.count} заданий
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
