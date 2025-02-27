import * as React from 'react'
import { Layout, Menu, Select } from 'antd'
import css from './LayoutView.module.css'
import { useAsyncFn, useCounter, useLocalStorage, useMount } from 'react-use'
import { i18n } from '../../constants/i18n'
import en from '../../i18n/en.json'
import zhCN from '../../i18n/zhCN.json'
import { LanguageEnum } from '@liuli-util/i18next-util'
import { routeList } from '../../constants/router'
import { Link, RouterView } from '@liuli-util/react-router'
import { getLanguage } from '../../common/getLanguage'

export const LayoutView: React.FC = () => {
  const [language, setLanguage] = useLocalStorage<LanguageEnum>(
    'language',
    getLanguage(),
  )
  const [{ value: list }, fetch] = useAsyncFn(
    async (language: LanguageEnum) => {
      console.log('language: ', language)
      await i18n.init({ en, zhCN }, language)
      return routeList.map((item) => ({
        ...item,
        title: i18n.t(item.title as any),
      }))
    },
    [],
  )

  useMount(() => fetch(language!))

  const [refreshKey, { inc }] = useCounter(0)
  async function changeLanguage(value: LanguageEnum) {
    setLanguage(value)
    await fetch(value)
    inc()
  }
  return (
    <Layout className={css.app}>
      <Layout.Sider className={css.sider} width="max-content">
        <h2 className={css.logo}>Joplin Batch</h2>
        <Menu>
          {list &&
            list.map((item) => (
              <Menu.Item key={item.path as string}>
                <Link to={item.path as string}>{item.title}</Link>
              </Menu.Item>
            ))}
        </Menu>
      </Layout.Sider>
      <Layout>
        <Layout.Header className={css.header}>
          <Select
            options={[
              { label: 'English', value: LanguageEnum.En },
              { label: '中文', value: LanguageEnum.ZhCN },
            ]}
            value={language}
            onChange={changeLanguage}
          />
        </Layout.Header>
        <Layout.Content className={css.main}>
          {list && <RouterView key={refreshKey} />}
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
