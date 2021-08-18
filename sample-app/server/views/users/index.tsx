import { User } from "../../components/User";

export default function UsersPage({ users }) {
    return (
        <div>
            <h1>Users</h1>
            <ul>
                {
                    users.map((u, i) => <User key={i} user={u}></User>)
                }
            </ul>
        </div>
    )
}