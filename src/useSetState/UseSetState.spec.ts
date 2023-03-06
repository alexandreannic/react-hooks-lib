import {useSetState} from './UseSetState'
import {expect} from 'chai'
import {renderHook} from '@testing-library/react-hooks'

describe('UseSetState', function () {

  it('should delete array', async function () {
    const state = renderHook(() => useSetState([1, 2, 3])).result.current
    state.delete([1, 2])
    expect(state.toArray()).eq([3])
  })
})
