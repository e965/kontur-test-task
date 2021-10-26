const { axios } = require("./fakeBackend/mock");

const getFeedbackByProductViewData = async (product, actualize = false) => {
	const result = { feedback: [], message: 'Success' }

	let isFeedbackQueryFailed = false
	let feedbackData = [];

	await axios.get('/feedback', { params: { product } })
		.then(response => {
			let feedback = response.data.feedback

			if (feedback.length === 0) {
				result.message = 'Отзывов пока нет'
				isFeedbackQueryFailed = true
			}

			feedbackData = feedback
		})
		.catch(error => {
			result.message = error.response.data.message
			isFeedbackQueryFailed = true
		})

	if (isFeedbackQueryFailed) {
		return result
	}

	const sortByDate = data => {
		return data.sort((a, b) => a.date - b.date)
	}

	feedbackData = sortByDate(feedbackData)

	// получаем только уникальные айдишники юзеров
	const AllUsersID = [...new Set(feedbackData.map(item => item.userId))]

	// при actualize = true, получаем только последние отзывы по каждому пользователю
	if (actualize) {
		let backSortedFeedback = [...feedbackData].reverse()
		let tmpFeedbackData = []

		AllUsersID.forEach(userId => {
			let feedbackItemByUser = backSortedFeedback.find(item => item.userId === userId)

			if (feedbackItemByUser) {
				tmpFeedbackData.push(feedbackItemByUser)
			}
		})

		tmpFeedbackData = sortByDate(tmpFeedbackData)

		feedbackData = tmpFeedbackData
	}

	let isUsersQueryFailed = false
	let usersData = []

	await axios.get('/users', { params: { ids: AllUsersID } })
		.then(response => {
			usersData = response.data.users
		})
		.catch(error => {
			result.message = error.response.data.message
			isFeedbackQueryFailed = true
		})

	if (isUsersQueryFailed) {
		return result
	}

	const dateFormatter = (_date) => {
		const date = new Date(_date)
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
	}

	const userFormatter = (userId) => {
		const userData = usersData.find(user => user.id === userId)
		return userData ? `${userData.name} (${userData.email})` : null
	}

	// форматируем...
	feedbackData = feedbackData.map(item => {
		return {
			...item,
			date: dateFormatter(item.date),
			user: userFormatter(item.userId)
		}
	})

	result.feedback = feedbackData

	return result
};

module.exports = { getFeedbackByProductViewData };
