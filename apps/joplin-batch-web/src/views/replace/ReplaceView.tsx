import { Button, Card, Form, Input, List, message, Space } from 'antd'
import React, { useState } from 'react'
import css from './ReplaceView.module.css'
import { TypeEnum } from 'joplin-api'
import { joplinApiGenerator } from '../../constants/joplinApiGenerator'
import { NoteProperties } from 'joplin-api/dist/modal/NoteProperties'
import Highlighter from 'react-highlight-words'
import { AsyncArray, asyncLimiting } from '@liuli-util/async'
import { i18n } from '../../constants/i18n'

interface SearchForm {
  keyword: string
  replaceText: string
}

type SearchNote = Pick<NoteProperties, 'id' | 'title' | 'body'>

export const ReplaceView: React.FC = () => {
  const [form] = Form.useForm<SearchForm>()
  const [list, setList] = useState<SearchNote[]>()

  async function onSearch() {
    const values = form.getFieldsValue()
    console.log('onSearch: ', values)
    const res = await joplinApiGenerator.searchApi.search({
      query: `body:${values.keyword}`,
      type: TypeEnum.Note,
      limit: 100,
      order_by: 'user_updated_time',
      order_dir: 'DESC',
      fields: ['id', 'title', 'body'],
    })
    console.log('res: ', res)
    setList(res.items)
    setPreview(undefined)
  }

  async function onReplace(item: SearchNote) {
    const values = form.getFieldsValue()
    await joplinApiGenerator.noteApi.update({
      id: item.id,
      body: item.body.replaceAll(values.keyword, values.replaceText),
    })
    await onSearch()
    message.success(i18n.t('replace.msg.replace'))
  }
  const [preview, setPreview] = useState<{ body: string; keyword: string }>()
  async function onPreview(item: SearchNote) {
    const values = form.getFieldsValue()
    setPreview({
      body: item.body,
      keyword: values.keyword,
    })
  }
  async function onReplaceAll() {
    if (!list || !(await form.validateFields())) {
      return
    }
    const values = form.getFieldsValue()
    await AsyncArray.forEach(
      list,
      asyncLimiting(async (item) => {
        await joplinApiGenerator.noteApi.update({
          id: item.id,
          body: item.body.replaceAll(values.keyword, values.replaceText),
        })
      }, 10),
    )
    await onSearch()
    message.success(i18n.t('replace.msg.replaceAll'))
  }
  return (
    <Card title={i18n.t('replace.title')} className={css.ReplaceView}>
      <Form form={form} initialValues={{ keyword: '', replaceText: '' } as SearchForm}>
        <Form.Item name={'keyword'} label={i18n.t('replace.form.keyword')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name={'replaceText'} label={i18n.t('replace.form.replaceText')} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type={'primary'} onClick={onSearch}>
              {i18n.t('replace.action.search')}
            </Button>
            <Button danger onClick={onReplaceAll}>
              {i18n.t('replace.action.replaceAll')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <div className={css.content}>
        <List
          dataSource={list}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button onClick={() => onReplace(item)}>{i18n.t('replace.action.replace')}</Button>,
                <Button onClick={() => onPreview(item)}>{i18n.t('replace.action.preview')}</Button>,
              ]}
            >
              <List.Item.Meta title={item.title} />
            </List.Item>
          )}
        />
        {preview && (
          <pre>
            <Highlighter textToHighlight={preview.body} searchWords={[preview.keyword]} />
          </pre>
        )}
      </div>
    </Card>
  )
}
