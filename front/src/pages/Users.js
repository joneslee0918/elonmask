import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { server_url } from './../services/api';
import Card from 'react-bootstrap/Card';

function Users() {
  return (
    <div className='container'>
      <Card style={{ width: '100%' }}>
        <Card.Body className='p-4 pt-5'>
          <Card.Title className=" mb-4">Authorization</Card.Title>
          <Form action={`${server_url}api/users`} method={'post'} >
            <Form.Group className="mb-4" >
              <Form.Label>User Name</Form.Label>
              <Form.Control type="text" name='username' placeholder="Enter your name" />
            </Form.Group>
            <Form.Group className="mb-4" controlId="formBasicPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name='password' placeholder="Password" />
            </Form.Group>
            <Button className='m-2' variant="primary" type="submit">Submit</Button>
            <Button className='m-2' href="/" variant="danger" type="submit">Cancel</Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

export default Users;