import {useFetcher} from './UseFetcher'
import {createUserApi} from '../useCrudList/UseCrudList.spec'
import {renderHook} from '@testing-library/react-hooks'

describe('UseFetcher', function () {

  it('. Typing playground', async function () {

    const userApi = createUserApi()

    const fetcher = renderHook(() => useFetcher(userApi.fetch)).result.current
    fetcher.fetch({force: true, clean: true}, {onlineOnly: true}).then(console.log)
  })
})
