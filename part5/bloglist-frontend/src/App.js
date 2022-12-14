import { useState, useEffect, useRef } from 'react'
import React from 'react'
import Blog from './components/Blog'
import Notification from './components/Notification'
import LoginForm from './components/Login'
import Logout from './components/Logout'
import BlogForm from './components/BlogForm'
import Togglable from './components/Togglable'

import blogService from './services/blogs'
import loginService from './services/login'


const App = () => {
  const [blogs, setBlogs] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    blogService.getAll().then(blogs =>
      setBlogs( blogs )
    )
  }, [])

  useEffect(() => {
    const loggedUserJson = window.localStorage.getItem('loggedBlogappUser')
    if (loggedUserJson) {
      const user = JSON.parse(loggedUserJson)
      setUser(user)
      blogService.setToken(user.token)
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({
        username, password,
      })
      setUser(user)
      blogService.setToken(user.token)
      window.localStorage.setItem('loggedBlogappUser', JSON.stringify(user))
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('wrong credentials')
      setTimeout(() => {
        setErrorMessage('')
      }, 5000)
    }
  }

  const handleDelete = async (event) => {
    event.preventDefault()
    blogService
      .remove(event.target.value)
    setBlogs(blogs.filter(b => b.id !== event.target.value))
    setSuccessMessage('blog was removed')
    setTimeout(() => {
      setSuccessMessage('')
    }, 5000)
  }


  const addBlog = (blogObject) => {
    blogFormRef.current.toggleVisibility()
    blogService
      .create(blogObject)
      .then(returnedBlog => {
        setBlogs(blogs.concat(returnedBlog))
        setSuccessMessage(`a new blog ${blogObject.title} by ${blogObject.author} added`)
        setTimeout(() => {
          setSuccessMessage('')
        }, 5000)
      })
  }

  const addLike = (id) => {
    const blog = blogs.find(b => b.id === id)
    const like = blog.likes + 1
    const updatedBlog = { ...blog, likes: like }

    blogService
      .update(id, updatedBlog)
      .then(() => {
        setBlogs(blogs.map(blog => blog.id !== id ? blog : updatedBlog))
      })
      .catch(() => {
        setErrorMessage(`problem updating blog ${blog.title} by ${blog.author}`)
        setTimeout(() => {
          setErrorMessage('')
        }, 5000)
        setBlogs(blogs.filter(b => b.id !== id))
      })
    setSuccessMessage(`blog ${blog.title} by ${blog.author} was liked`)
    setTimeout(() => {
      setSuccessMessage('')
    }, 5000)
  }


  const handleLogout = () => {
    //event.preventDefault()
    window.localStorage.removeItem('loggedBlogappUser')
    // empty localstorage completely
    // window.localStorage.clear()
  }

  const blogFormRef = useRef()

  return (
    <div>
      <h2>blogs</h2>
      <Notification errorMessage={errorMessage} successMessage={successMessage}/>

      { user === null ?
        <div>
          <Togglable buttonLabel='login'>
            <LoginForm
              username={username} password={password} handleUsernameChange={({ target }) => setUsername(target.value)}
              handlePasswordChange={({ target }) => setPassword(target.value)} handleSubmit={handleLogin}
            />
          </Togglable>
          {blogs.sort((a,b) => b.likes - a.likes).map(blog =>
            <Blog key={blog.id} blog={blog} addLike={() => addLike(blog.id)} remove={false}/>
          )}
        </div>
        :
        <div>
          <Logout name={user.name} handleSubmit={handleLogout}/>
          <Togglable buttonLabel='create new blog' ref={blogFormRef}>
            <BlogForm createBlog={addBlog} />
          </Togglable>
          <br />
          {blogs.sort((a,b) => b.likes - a.likes).map(blog => {

            let remove = blog.user.username === user.username ? true : false
            //console.log(remove)
            // console.log(blog)
            //console.log(user.username)
            return (
              <Blog key={blog.id} blog={blog} addLike={() => addLike(blog.id)} remove={remove} handleRemove={handleDelete} />
            )}
          )}
        </div>
      }
    </div>
  )
}

export default App
