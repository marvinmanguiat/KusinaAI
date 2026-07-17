const Dashboard = () => {
    return (
        <>
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1 className="m-0">Dashboard</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">

                    <div className="row">

                        <div className="col-lg-3 col-6">
                            <div className="small-box text-bg-primary">
                                <div className="inner">
                                    <h3>120</h3>
                                    <p>Products</p>
                                </div>

                                <div className="small-box-icon">
                                    <i className="bi bi-box-seam"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-6">
                            <div className="small-box text-bg-success">
                                <div className="inner">
                                    <h3>25</h3>
                                    <p>Suppliers</p>
                                </div>

                                <div className="small-box-icon">
                                    <i className="bi bi-truck"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-6">
                            <div className="small-box text-bg-warning">
                                <div className="inner">
                                    <h3>35</h3>
                                    <p>Customers</p>
                                </div>

                                <div className="small-box-icon">
                                    <i className="bi bi-people"></i>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-3 col-6">
                            <div className="small-box text-bg-danger">
                                <div className="inner">
                                    <h3>18</h3>
                                    <p>Low Stock</p>
                                </div>

                                <div className="small-box-icon">
                                    <i className="bi bi-exclamation-triangle"></i>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                Welcome
                            </h3>
                        </div>

                        <div className="card-body">
                            Welcome to the Inventory Management System Dashboard.
                        </div>
                    </div>

                </div>
            </section>
        </>
    );
};

export default Dashboard;