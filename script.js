
const state = {
	users: [], 
	session: null, 
	books: [
		{ id: 'b1', title: 'Наследница чёрного дракона', author: 'Анна Джеён', price: 1200, tags: ['Романтика'] },
		{ id: 'b2', title: 'Преступление и наказание', author: 'Достоевский', price: 900, tags: ['классика'] },
		{ id: 'b3', title: 'Заводной апельсин', author: 'Джроруэлл', price: 1500, tags: ['классика'] },
		{ id: 'b4', title: 'Король Ардена', author: 'Софи Анри', price: 1300, tags: ['фэнтези'] },
	],
	cart: [], 
};


const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const formatPrice = (num) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(num);

function hash(str) {
	
	let h = 0;
	for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
	return String(h >>> 0);
}

function currentUser() {
	if (!state.session) return null;
	return state.users.find(u => u.id === state.session.userId) || null;
}

// Countries for dropdown
const COUNTRIES = [
	'Россия','США','Германия','Франция','Италия','Испания','Великобритания','Украина','Беларусь','Казахстан','Китай','Япония','Индия','Бразилия','Канада','Австралия'
];

function renderCountryOptions(selected) {
	const hasSelected = COUNTRIES.includes(selected);
	const placeholder = `<option value="" ${hasSelected ? '' : 'selected'}>— Выберите страну —</option>`;
	return placeholder + COUNTRIES.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

function setAlert(msg) {
	const el = $('#routeAlert');
	if (!el) return;
	el.textContent = msg || '';
	el.hidden = !msg;
	if (msg) setTimeout(() => { el.hidden = true; }, 2500);
}

function updateAuthUI() {
	const isAuth = !!currentUser();
	$$('.auth-only').forEach(el => el.hidden = !isAuth);
	$$('.guest-only').forEach(el => el.hidden = isAuth);
	$('#logoutBtn').onclick = () => {
		state.session = null;
		setAlert('Вы вышли из системы');
		navigate('#/');
	};
}

function updateCartUI() {
	const count = state.cart.reduce((sum, i) => sum + i.qty, 0);
	const el = $('#cartCount');
	if (el) el.textContent = String(count);
}

function navigate(hash) {
	if (location.hash !== hash) {
		location.hash = hash;
	} else {
		render();
	}
}


function ViewLanding() {
	return `
	<section class="hero">
		<h1>Добро пожаловать в BookStore</h1>
		<p>Находите лучшие книги по программированию и не только.</p>
		<div class="hero-actions">
			<a class="btn primary" href="#/store">Перейти в магазин</a>
			<a class="btn" href="#/register">Зарегистрироваться</a>
		</div>
	</section>
	`;
}

function ViewRegister() {
	return `
	<section class="card">
		<h2>Регистрация</h2>
		<form id="registerForm" class="form">
			<label>Учетное имя (логин)*<input required name="username" autocomplete="username"></label>
			<label>Email*<input required name="email" type="email" autocomplete="email"></label>
			<label>Пароль*<input required name="password" type="password" minlength="6" pattern="(?=.*[A-Za-z]).{6,}" title="Минимум 6 символов и хотя бы одна буква" autocomplete="new-password"></label>
			<label>Имя<input name="firstName" autocomplete="given-name"></label>
			<label>Фамилия<input name="lastName" autocomplete="family-name"></label>
			<label>Дата рождения<input name="birthDate" type="date" min="1900-01-01" max="2025-01-01"></label>
			<label>Страна<select name="country">${renderCountryOptions('')}</select></label>
			<button class="btn primary" type="submit">Создать аккаунт</button>
		</form>
		<p class="muted">Уже есть аккаунт? <a href="#/login">Войти</a></p>
	</section>
	`;
}

function ViewLogin() {
	return `
	<section class="card">
		<h2>Вход</h2>
		<form id="loginForm" class="form">
			<label>Email<input required name="email" type="email" autocomplete="email"></label>
			<label>Пароль<input required name="password" type="password" minlength="6" pattern="(?=.*[A-Za-z]).{6,}" title="Минимум 6 символов и хотя бы одна буква" autocomplete="current-password"></label>
			<button class="btn primary" type="submit">Войти</button>
		</form>
		<p class="muted">Нет аккаунта? <a href="#/register">Регистрация</a></p>
	</section>
	`;
}

function ViewProfile() {
	const user = currentUser();
	if (!user) return GuardAuth();
	return `
	<section class="card">
		<h2>Профиль</h2>
		<form id="profileForm" class="form">
			<label>Логин<input name="username" value="${user.username || ''}" required autocomplete="username"></label>
			<label>Email<input name="email" type="email" value="${user.email}" required autocomplete="email"></label>
			<label>Имя<input name="firstName" value="${user.firstName || ''}" autocomplete="given-name"></label>
			<label>Фамилия<input name="lastName" value="${user.lastName || ''}" autocomplete="family-name"></label>
			<label>Дата рождения<input name="birthDate" type="date" value="${user.birthDate || ''}" min="1900-01-01" max="2025-01-01"></label>
			<label>Страна<select name="country">${renderCountryOptions(user.country || '')}</select></label>
			<div style="display:flex; gap:8px;">
				<button class="btn primary" type="submit">Сохранить</button>
				<button class="btn" type="button" id="cancelEdit">Отмена</button>
			</div>
		</form>
	</section>
	`;
}

function renderBookItem(book) {
	return `
	<li class="book">
		<div class="book-main">
			<div class="book-title">${book.title}</div>
			<div class="book-meta">${book.author}</div>
		</div>
		<div class="book-buy">
			<div class="book-price">${formatPrice(book.price)}</div>
			<button class="btn add-to-cart" data-id="${book.id}">В корзину</button>
		</div>
	</li>`;
}

function ViewStore() {
	const items = state.books.map(renderBookItem).join('');
	const cartItems = state.cart.map(ci => {
		const b = state.books.find(x => x.id === ci.bookId);
		return b ? `<li class="cart-item">
			<span>${b.title}</span>
			<div class="cart-controls">
				<button class="qty" data-act="dec" data-id="${b.id}">−</button>
				<span>${ci.qty}</span>
				<button class="qty" data-act="inc" data-id="${b.id}">+</button>
			</div>
			<span>${formatPrice(b.price * ci.qty)}</span>
		</li>` : '';
	}).join('');

	const total = state.cart.reduce((sum, i) => {
		const b = state.books.find(x => x.id === i.bookId);
		return sum + (b ? b.price * i.qty : 0);
	}, 0);

	return `
	<section class="store">
		<div class="store-left">
			<div class="toolbar">
				<input id="search" placeholder="Поиск книг..." aria-label="Поиск">
			</div>
			<ul id="bookList" class="book-list">${items}</ul>
		</div>
		<aside class="store-right">
			<h3>Корзина</h3>
			<ul id="cartList" class="cart-list">${cartItems || '<li class="muted">Пусто</li>'}</ul>
			<div class="cart-total"><strong>Итого:</strong> <span id="totalPrice">${formatPrice(total)}</span></div>
			<button id="checkoutBtn" class="btn primary" ${state.cart.length ? '' : 'disabled'}>Оформить</button>
		</aside>
	</section>
	`;
}

function GuardAuth() {
	return `
	<section class="card">
		<h2>Требуется аутентификация</h2>
		<p>Пожалуйста, выполните <a href="#/login">вход</a>.</p>
	</section>`;
}


const routes = {
	'/': ViewLanding,
	'/register': ViewRegister,
	'/login': ViewLogin,
	'/profile': () => currentUser() ? ViewProfile() : GuardAuth(),
	'/store': ViewStore,
};

function render() {
	const app = $('#app');
	const path = (location.hash.slice(1) || '/');
	const view = routes[path] || (() => `<section><h2>404</h2></section>`);
	app.innerHTML = view();
	bindViewEvents(path);
	updateAuthUI();
	updateCartUI();
}

function bindViewEvents(path) {
	if (path === '/register') {
		$('#registerForm').addEventListener('submit', (e) => {
			e.preventDefault();
			const fd = new FormData(e.target);
			const username = (fd.get('username') || '').toString().trim();
			const email = (fd.get('email') || '').toString().trim().toLowerCase();
			const password = (fd.get('password') || '').toString();
			const firstName = (fd.get('firstName') || '').toString().trim();
			const lastName = (fd.get('lastName') || '').toString().trim();
			const birthDate = (fd.get('birthDate') || '').toString();
			const country = (fd.get('country') || '').toString().trim();

			const hasMinLen = password.length >= 6;
			const hasLetter = /[A-Za-z]/.test(password);
			if (!hasMinLen || !hasLetter) {
				setAlert('Пароль должен быть не менее 6 символов и содержать буквы');
				return;
			}
			if (state.users.some(u => u.username === username)) {
				setAlert('Логин уже занят');
				return;
			}
			if (state.users.some(u => u.email === email)) {
				setAlert('Email уже зарегистрирован');
				return;
			}
			const user = {
				id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
				username,
				email,
				passwordHash: hash(password),
				firstName,
				lastName,
				birthDate,
				country
			};
			state.users.push(user);

			setAlert('Регистрация успешна, выполните вход');
			navigate('#/login');
		});
	}

	if (path === '/login') {
		$('#loginForm').addEventListener('submit', (e) => {
			e.preventDefault();
			const fd = new FormData(e.target);
			const email = (fd.get('email') || '').toString().trim().toLowerCase();
			const password = (fd.get('password') || '').toString();
			const user = state.users.find(u => u.email === email && u.passwordHash === hash(password));
			if (!user) {
				setAlert('Неверные учетные данные');
				return;
			}
			state.session = { userId: user.id };
			setAlert('Вы вошли');
			navigate('#/profile');
		});
	}

	if (path === '/profile') {
		const form = $('#profileForm');
		const user = currentUser();
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const fd = new FormData(form);
			const username = (fd.get('username') || '').toString().trim();
			const email = (fd.get('email') || '').toString().trim().toLowerCase();
			const firstName = (fd.get('firstName') || '').toString().trim();
			const lastName = (fd.get('lastName') || '').toString().trim();
			const birthDate = (fd.get('birthDate') || '').toString();
			const country = (fd.get('country') || '').toString().trim();
			// Validate birth date range
			if (birthDate && (birthDate < '1900-01-01' || birthDate > '2025-01-01')) {
				setAlert('Дата рождения должна быть между 1900-01-01 и 2025-01-01');
				return;
			}
			// Uniqueness checks excluding current user
			if (state.users.some(u => u.username === username && u.id !== user.id)) {
				setAlert('Логин уже занят');
				return;
			}
			if (state.users.some(u => u.email === email && u.id !== user.id)) {
				setAlert('Email уже зарегистрирован');
				return;
			}
			user.username = username;
			user.email = email;
			user.firstName = firstName;
			user.lastName = lastName;
			user.birthDate = birthDate;
			user.country = country;
			setAlert('Профиль обновлен');
		});

		$('#cancelEdit').addEventListener('click', () => navigate('#/profile'));
	}

	if (path === '/store') {
		const list = $('#bookList');
		list.addEventListener('click', (e) => {
			const btn = e.target.closest('.add-to-cart');
			if (!btn) return;
			const id = btn.getAttribute('data-id');
			const item = state.cart.find(i => i.bookId === id);
			if (item) item.qty += 1; else state.cart.push({ bookId: id, qty: 1 });
			updateCartSidebar();
			updateCartUI();
		});

		$('#search').addEventListener('input', (e) => {
			const q = e.target.value.toLowerCase();
			$$('#bookList .book').forEach(li => {
				const txt = li.textContent.toLowerCase();
				li.style.display = txt.includes(q) ? '' : 'none';
			});
		});

		$('#cartList').addEventListener('click', (e) => {
			const btn = e.target.closest('.qty');
			if (!btn) return;
			const id = btn.getAttribute('data-id');
			const act = btn.getAttribute('data-act');
			const item = state.cart.find(i => i.bookId === id);
			if (!item) return;
			if (act === 'inc') item.qty += 1;
			if (act === 'dec') item.qty -= 1;
			if (item.qty <= 0) state.cart = state.cart.filter(i => i.bookId !== id);
			updateCartSidebar();
			updateCartUI();
		});

		$('#checkoutBtn').addEventListener('click', () => {
			if (!state.cart.length) return;
			if (!currentUser()) {
				setAlert('Для оформления войдите в профиль');
				navigate('#/login');
				return;
			}
			const total = state.cart.reduce((s, i) => {
				const b = state.books.find(x => x.id === i.bookId);
				return s + (b ? b.price * i.qty : 0);
			}, 0);
			state.cart = [];
			updateCartSidebar();
			updateCartUI();
			setAlert(`Заказ оформлен на сумму ${formatPrice(total)}`);
		});
	}
}

function updateCartSidebar() {
	const cartList = $('#cartList');
	if (!cartList) return;
	const items = state.cart.map(ci => {
		const b = state.books.find(x => x.id === ci.bookId);
		return b ? `<li class="cart-item">
			<span>${b.title}</span>
			<div class="cart-controls">
				<button class="qty" data-act="dec" data-id="${b.id}">−</button>
				<span>${ci.qty}</span>
				<button class="qty" data-act="inc" data-id="${b.id}">+</button>
			</div>
			<span>${formatPrice(b.price * ci.qty)}</span>
		</li>` : '';
	}).join('');
	cartList.innerHTML = items || '<li class="muted">Пусто</li>';
	const total = state.cart.reduce((sum, i) => {
		const b = state.books.find(x => x.id === i.bookId);
		return sum + (b ? b.price * i.qty : 0);
	}, 0);
	const totalEl = $('#totalPrice');
	if (totalEl) totalEl.textContent = formatPrice(total);
	$('#checkoutBtn')?.toggleAttribute('disabled', state.cart.length === 0);
}


function init() {
	$('#year').textContent = String(new Date().getFullYear());
	window.addEventListener('hashchange', render);
	if (!location.hash) location.hash = '#/';
	render();
}

document.addEventListener('DOMContentLoaded', init);

