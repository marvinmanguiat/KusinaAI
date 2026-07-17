const Users = () => {
    const users = [
        {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "Administrator"
        },
        {
            id: 2,
            name: "Jane Smith",
            email: "jane@example.com",
            role: "Staff"
        },
        {
            id: 3,
            name: "Michael Johnson",
            email: "michael@example.com",
            role: "Manager"
        }
    ];

    return (
        <>
            <div className="content-header">
                <div className="container-fluid">

                    <div className="row mb-2">

                        <div className="col-sm-6">
                            <h1>Users</h1>
                        </div>

                        <div className="col-sm-6 text-end">
                            <button className="btn btn-primary">
                                <i className="bi bi-plus-circle me-1"></i>
                                Add User
                            </button>
                        </div>

                    </div>

                </div>
            </div>

            <section className="content">

                <div className="container-fluid">

                    <div className="card">

                        <div className="card-header">
                            <h3 className="card-title">
                                User List
                            </h3>
                        </div>

                        <div className="card-body">

                            <table className="table table-bordered table-hover">

                                <thead>

                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th style={{ width: 180 }}>
                                            Action
                                        </th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {users.map(user => (

                                        <tr key={user.id}>

                                            <td>{user.id}</td>

                                            <td>{user.name}</td>

                                            <td>{user.email}</td>

                                            <td>{user.role}</td>

                                            <td>

                                                <button className="btn btn-sm btn-warning me-2">
                                                    <i className="bi bi-pencil"></i>
                                                </button>

                                                <button className="btn btn-sm btn-danger">
                                                    <i className="bi bi-trash"></i>
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </section>
        </>
    );
};

export default Users;