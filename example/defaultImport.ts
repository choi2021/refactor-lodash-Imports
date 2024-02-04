import _ from "lodash";

type user = {
    user: string;
    age: number;
    active: boolean;
}
var users: user[] = [
    {'user': 'barney', 'age': 36, 'active': true},
    {'user': 'fred', 'age': 40, 'active': false}
];

_.filter(users, {'age': 36, 'active': true});
