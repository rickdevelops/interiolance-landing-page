/* INTERIOLANCE studio website template. Booking form is a front-end demo until connected to a real inbox/calendar. */
document.documentElement.classList.add('js');
const menuToggle=document.querySelector('.menu-toggle');
const mainNav=document.querySelector('.main-nav');
if(menuToggle&&mainNav){
  menuToggle.addEventListener('click',()=>{const open=mainNav.classList.toggle('is-open');menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');menuToggle.querySelector('.menu-label').textContent=open?'Close':'Menu';});
  mainNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(window.innerWidth<=820){mainNav.classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');menuToggle.querySelector('.menu-label').textContent='Menu';}}));
}
const revealItems=document.querySelectorAll('.reveal');
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});revealItems.forEach(item=>observer.observe(item));
}else revealItems.forEach(item=>item.classList.add('is-visible'));
document.querySelectorAll('.faq-question').forEach(button=>button.addEventListener('click',()=>{const item=button.closest('.faq-item');const open=item.classList.contains('is-open');item.parentElement.querySelectorAll('.faq-item').forEach(other=>{other.classList.remove('is-open');other.querySelector('.faq-question').setAttribute('aria-expanded','false');other.querySelector('.plus').textContent='+';});if(!open){item.classList.add('is-open');button.setAttribute('aria-expanded','true');button.querySelector('.plus').textContent='×';}}));
document.querySelectorAll('[data-demo-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const status=form.querySelector('.form-status');if(status){status.textContent='Thanks for sharing a little about your project. This is a template preview, so your details have not been sent or saved. Connect this form to your email, CRM or booking calendar before publishing.';status.classList.add('visible');status.scrollIntoView({behavior:'smooth',block:'nearest'});}form.reset();}));
document.querySelectorAll('[data-current-year]').forEach(node=>node.textContent=new Date().getFullYear());
