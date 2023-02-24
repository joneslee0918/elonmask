import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { server_url } from './../services/api';

function Users() {
  return (
    <div className='container'>
      <Form action={`${server_url}api/users`} method={'post'} style={{ width: "40%" }}>
        <Form.Group className="mb-3" >
          <Form.Label>User Name</Form.Label>
          <Form.Control type="text" name='username' placeholder="Enter your name" />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" name='password' placeholder="Password" />
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}

export default Users;