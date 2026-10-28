import { useNavigate } from 'react-router-dom'
import { useStore } from '../app/store'
import { Button, Card, Chip, Icon, InfoNote, PageHeader } from '../components/ui'
import { ConfigPanel } from '../components/ConfigPanel'
import { createSession } from '../services/session'
import { saveActiveSession } from '../services/storage'
import { useToast } from '../components/ui'
import type { Settings } from '../types'

export function SetupPage() {
  const { settings, updateSettings, state } = useStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const launch = (overrides: Partial<Settings> = {}) => {
    const next: Settings = { ...settings, ...overrides, onboarded: true }
    const session = createSession(next.mode, next, state.progress)
    const empty =
      session.kind === 'study' || session.kind === 'flashcards'
        ? session.itemIds.length === 0
        : session.questions.length === 0
    if (empty) {
      toast('По выбранным фильтрам нет материалов. Сбросьте часть настроек.', 'danger')
      return
    }
    updateSettings({ ...overrides, onboarded: true })
    saveActiveSession(session)
    navigate('/session')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Тренажёр"
        title="Настройте занятие"
        description="Выберите класс, сложность, типы материалов и темы. Можно заниматься десять минут или пройти тему целиком."
        actions={
          <Button variant="secondary" onClick={() => navigate('/reference')} iconLeft={<Icon name="book" size={16} />}>
            Справочник
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Chip tone="outline" size="sm">
          Быстрый старт
        </Chip>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => launch({ mode: 'flashcards', count: 5, itemFilter: 'all', difficulty: 1 })}
          iconLeft={<Icon name="sparkles" size={14} />}
        >
          Разминка 5
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => launch({ mode: 'flashcards', count: 20, itemFilter: 'due' })}
          iconLeft={<Icon name="refresh" size={14} />}
        >
          Повторить на сегодня
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => launch({ mode: 'review', count: 20, itemFilter: 'errors' })}
          iconLeft={<Icon name="alert" size={14} />}
        >
          Работа над ошибками
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => launch({ mode: 'exam', count: 30, itemFilter: 'all', difficulty: 2 })}
          iconLeft={<Icon name="flag" size={14} />}
        >
          Экзамен 30
        </Button>
      </div>

      <Card className="lg:p-7">
        <ConfigPanel onStart={() => launch()} startLabel={`Начать: ${modeLabel(settings.mode)}`} />
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoNote tone="info" title="Как выбираются материалы">
          Фильтры применяются до старта занятия. «Пора повторить» — материалы с наступившей датой повторения,
          «только ошибки» — те, где была ошибка, подсказка или неуверенный ответ.
        </InfoNote>
        <InfoNote tone="success" title="Прогресс сохраняется автоматически">
          Настройки, статистика и расписание повторений хранятся в LocalStorage этого браузера. Резервную копию можно
          сделать в разделе «Настройки».
        </InfoNote>
      </div>
    </div>
  )
}

function modeLabel(mode: Settings['mode']): string {
  return {
    study: 'изучение',
    flashcards: 'карточки',
    recall: 'воспроизведение',
    quiz: 'тест',
    exam: 'экзамен',
    review: 'ошибки',
  }[mode]
}
