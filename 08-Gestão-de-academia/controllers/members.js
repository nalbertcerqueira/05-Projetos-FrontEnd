/* Importando variáveis e métodos*/
const { writeFile } = require("fs").promises
const data = require("../data.json")
const { getAge, getBirthDate, updatePersonAge } = require("./utils.js")

/*Métodos na CRUD de alunos */
module.exports.index = function (req, res) {
    res.render("./Members/index.njk", { members: data.members })
}
module.exports.create = function (req, res) {
    res.render("./Members/create")
}
module.exports.post = async function (req, res) {
    //Verificando se todos os campos foram preenchidos
    const keys = Object.keys(req.body)
    for (let key of keys) {
        try {
            if (req.body[key] === "")
                throw new Error(
                    "Error 422: the user needs to fill all the fields before sending the form."
                )
        } catch (error) {
            return res.status(422).render("./errors.njk", {
                status: "Error 422",
                msg: "Please fill all the fields before sending the form."
            })
        }
    }

    //Tratando os dados do req.boby e adicionando novos dados
    let { birth } = req.body
    birth = Date.parse(birth)
    const id = Date.now().toString()
    const age = getAge(id, birth)
    const birthday = getBirthDate(birth).memberDate
    data.members.push({
        id, // Não veio do req.body
        ...req.body,
        birth: birth,
        age, // Não veio do req.body
        birthday // Não veio do req.body
    })

    //Atualizando o arquivo data.json com o cadastro do novo aluno
    try {
        await writeFile("./data.json", JSON.stringify(data, null, 4), { encoding: "utf-8" })
    } catch (error) {
        return res.status(500).render("./errors.njk", {
            status: "Error 500",
            msg: "Sorry, we're facing some problems in the server."
        })
    }

    return res.redirect(`/members/${id}`)
}
module.exports.findMember = async function (req, res) {
    let { id } = req.params
    const foundMember = data.members.find((value) => value.id == id)

    try {
        if (!foundMember) throw new Error("Error 404: the memeber was not found.")
    } catch (error) {
        return res
            .status(404)
            .render("./errors.njk", { status: "Error 404", msg: "Sorry, member not found." })
    }

    /* Atualizando a idade do aluno em caso de aniversário*/
    try {
        await updatePersonAge(res, { person: foundMember, type: "members" })
    } catch (error) {
        return res.status(500).render("./errors.njk", {
            status: "Error 500",
            msg: "Server internal error."
        })
    }

    return res.render("./Members/showmember", { member: foundMember })
}
module.exports.edit = function (req, res) {
    //Buscando aluno com base no ID
    let { id } = req.params
    const foundMember = data.members.find((value) => value.id == id)
    try {
        if (!foundMember)
            throw new Error("Error 404: the member, user is looking for was not found.")
    } catch (error) {
        return res
            .status(404)
            .render("./errors.njk", { status: "Error 404", msg: "Sorry, member not found." })
    }

    //Atualizando a idade do aluno em caso de aniversário
    const { birth } = foundMember
    const member = {
        ...foundMember,
        birth: getBirthDate(birth).iso
    }

    return res.render("./Members/edit.njk", { member })
}
module.exports.put = async function (req, res) {
    const keys = Object.keys(req.body)

    //Verificando se todos os campos foram preenchidos
    for (let key of keys) {
        try {
            if (req.body[key] === "")
                throw new Error(
                    "Error 422: the user needs to fill all the fields before sending the form."
                )
        } catch (error) {
            return res.status(422).render("./errors.njk", {
                status: "Error 422",
                msg: "Please fill all the fields before sending the form."
            })
        }
    }

    //Buscando aluno com base no ID
    let { id, birth } = req.body
    let foundIndex
    const foundMember = data.members.find((value, index) => {
        if (value.id == id) {
            foundIndex = index
            return value
        }
    })

    try {
        if (!foundMember)
            throw new Error("Error 404: the member, user is looking for was not found.")
    } catch (error) {
        return res
            .status(404)
            .render("./errors.njk", { status: "Error 404", msg: "Sorry, member not found." })
    }

    //Atualizando os dados do aluno
    const createdAt = Date.now()
    const age = getAge(createdAt, birth)
    const birthday = getBirthDate(birth).memberDate
    let member = {
        ...foundMember,
        ...req.body,
        birth: Date.parse(birth),
        age: age,
        birthday: birthday
    }

    //Atualizando os dados do aluno e reescrevendo o data.json
    data.members[foundIndex] = member
    try {
        await writeFile("data.json", JSON.stringify(data, null, 4), { encoding: "utf-8" })
    } catch (error) {
        return res.status(500).render("./errors.njk", {
            status: "Error 500",
            msg: "Sorry, we're facing some problems in the server."
        })
    }
    return res.redirect(`members/${id}`)
}
module.exports.delete = async function (req, res) {
    const { id } = req.body
    let foundIndex = data.members.findIndex((value) => value.id === id)

    //Tratando o erro caso o usuário tente excluir o membro mais de uma vez
    try {
        if (foundIndex < 0) throw new Error("Error 404: the member was already deleted.")
    } catch (error) {
        return res
            .status(404)
            .render("./errors.njk", { status: "Error 404", msg: "member was already deleted." })
    }

    //Excluindo o instrutor do banco de dados
    data.members.splice(foundIndex, 1)

    //Reescrevendo o arquivo data.json
    try {
        await writeFile("data.json", JSON.stringify(data, null, 4), { encoding: "utf-8" })
    } catch (error) {
        return res.status(500).render("./errors.njk", {
            status: "Error 500",
            msg: "Sorry, we're facing some problems in the server."
        })
    }

    return res.redirect("/members")
}
