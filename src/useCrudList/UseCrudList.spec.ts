import {Id, useCrudList} from './UseCrudList'
import {expect} from 'chai'

interface User {
  id: Id
  name?: string
}

const createUserApi = () => {
  const users: User[] = [{id: '1', name: 'Mat Fraser'}]
  return {
    users,
    fetch: () => Promise.resolve(users),
    create: (u: User) => {
      users.push(u)
      return Promise.resolve(u)
    },
    update: (id: Id, updatedUser: User) => Promise.resolve({
      ...users.map(_ => (_.id === id) ? {..._, ...updatedUser} : _),
    }),
    delete: (id: Id) => Promise.resolve(users.filter(_ => _.id !== id)),
  }
}

describe('UseCrudList', function () {

  it('should return the correct number', async function () {

    const userApi = createUserApi()

    const crud = useCrudList<User>({
      r: userApi.fetch,
    })

    await crud.fetch({})()
    expect(crud.list).deep.eq(userApi.users)
  })

  // it('should return the correct number', async function () {
  //   const crud = useCrudList<User>({
  //     r: (): Promise<User> => Promise.resolve({id: ''}),
  //     d: (): Promise<void> => Promise.resolve(),
  //     u: (id: Id): Promise<User> => Promise.resolve({id: ''}),
  //     c: (user: User): Promise<User> => Promise.resolve({id: ''}),
  //   });
  //
  //   crud.list();
  //   crud.clearCache();
  //   crud.create({a: ''});
  //   crud.update('1');
  //   crud.remove('1');
  // });
})
